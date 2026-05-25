use anyhow::{Context, anyhow};
use windows::Win32::Foundation::DISP_E_EXCEPTION;
use windows::Win32::System::Com::{
    DISPATCH_FLAGS, DISPATCH_METHOD, DISPATCH_PROPERTYGET, DISPPARAMS, EXCEPINFO, IDispatch,
};
use windows::Win32::System::Variant::{VARIANT, VT_BSTR, VT_EMPTY, VT_NULL};
use windows::core::{BSTR, PCWSTR};

#[derive(Debug)]
pub enum Arg {
    I32(i32),
    Str(String),
    Dispatch(IDispatch),
}

fn name_to_dispid(disp: &IDispatch, name: &str) -> anyhow::Result<i32> {
    let mut dispid: i32 = 0;
    let wname: Vec<u16> = name.encode_utf16().chain(std::iter::once(0)).collect();
    let pcw = PCWSTR(wname.as_ptr());
    unsafe {
        disp.GetIDsOfNames(
            &windows::core::GUID::zeroed(),
            &pcw as *const PCWSTR,
            1,
            0x0409,
            &mut dispid,
        )
        .ok()
        .with_context(|| format!("GetIDsOfNames failed for {name}"))?;
    }
    Ok(dispid)
}

fn variant_from_arg(arg: Arg) -> anyhow::Result<VARIANT> {
    Ok(match arg {
        Arg::I32(v) => VARIANT::from(v),
        Arg::Str(s) => VARIANT::from(BSTR::from(s)),
        Arg::Dispatch(d) => VARIANT::from(d),
    })
}

fn invoke(
    disp: &IDispatch,
    dispid: i32,
    flags: DISPATCH_FLAGS,
    mut args: Vec<VARIANT>,
    mut named_args: Vec<i32>,
) -> anyhow::Result<VARIANT> {
    args.reverse();

    let mut result: VARIANT = VARIANT::default();
    let mut ex: EXCEPINFO = EXCEPINFO::default();
    let mut arg_err: u32 = 0;

    let mut dp = DISPPARAMS {
        rgvarg: if args.is_empty() {
            std::ptr::null_mut()
        } else {
            args.as_mut_ptr()
        },
        rgdispidNamedArgs: if named_args.is_empty() {
            std::ptr::null_mut()
        } else {
            named_args.as_mut_ptr()
        },
        cArgs: args.len() as u32,
        cNamedArgs: named_args.len() as u32,
    };

    unsafe {
        let r = disp.Invoke(
            dispid,
            &windows::core::GUID::zeroed(),
            0x0409,
            flags,
            &mut dp,
            Some(&mut result),
            Some(&mut ex),
            Some(&mut arg_err),
        );

        if let Err(e) = r {
            if e.code() == DISP_E_EXCEPTION {
                let desc = if ex.bstrDescription.is_empty() {
                    "<no description>".to_string()
                } else {
                    ex.bstrDescription.to_string()
                };
                return Err(anyhow!("IDispatch exception: {}", desc));
            }
            return Err(anyhow!("IDispatch Invoke failed: {}", e));
        }
    }

    Ok(result)
}

pub fn call_method(disp: &IDispatch, name: &str, args: Vec<Arg>) -> anyhow::Result<VARIANT> {
    let dispid = name_to_dispid(disp, name)?;
    let mut vars = Vec::with_capacity(args.len());
    for arg in args {
        vars.push(variant_from_arg(arg)?);
    }
    invoke(disp, dispid, DISPATCH_METHOD, vars, vec![])
}

pub fn get_property(disp: &IDispatch, name: &str) -> anyhow::Result<VARIANT> {
    let dispid = name_to_dispid(disp, name)?;
    invoke(disp, dispid, DISPATCH_PROPERTYGET, vec![], vec![])
}

pub fn as_dispatch(value: &VARIANT) -> anyhow::Result<IDispatch> {
    Ok(value
        .try_into()
        .context("VARIANT -> IDispatch conversion failed")?)
}

pub fn as_string(value: &VARIANT) -> anyhow::Result<String> {
    unsafe {
        let vt = value.Anonymous.Anonymous.vt.0 as u32;
        if vt == VT_EMPTY.0 as u32 || vt == VT_NULL.0 as u32 {
            return Ok(String::new());
        }
        if vt != VT_BSTR.0 as u32 {
            return Err(anyhow!("Expected VT_BSTR, got vt={vt}"));
        }
        let bstr: &BSTR = &*value.Anonymous.Anonymous.Anonymous.bstrVal;
        Ok(bstr.to_string())
    }
}

pub fn as_i32(value: &VARIANT) -> anyhow::Result<i32> {
    if let Ok(i) = <i32 as TryFrom<&VARIANT>>::try_from(value) {
        return Ok(i);
    }
    if let Ok(u) = <u32 as TryFrom<&VARIANT>>::try_from(value) {
        return Ok(u as i32);
    }
    Err(anyhow!("VARIANT -> i32 conversion failed"))
}
