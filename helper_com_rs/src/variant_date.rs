use windows::Win32::System::Variant::VARIANT;

pub fn variant_date_to_iso8601(value: &VARIANT) -> anyhow::Result<String> {
    if let Ok(date) = <f64 as TryFrom<&VARIANT>>::try_from(value) {
        let unix_seconds = ((date - 25569.0) * 86400.0) as i64;
        if let Some(datetime) = chrono::DateTime::from_timestamp(unix_seconds, 0) {
            return Ok(datetime.to_rfc3339());
        }
    }

    Ok(String::new())
}
