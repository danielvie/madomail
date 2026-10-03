// Run with `npm run icons`. Electron renders the SVG without extra dependencies.
const { app, BrowserWindow, nativeImage } = require('electron')
const fs = require('node:fs/promises')
const path = require('node:path')
const root = path.resolve(__dirname, '..')

function encodeIco(images) {
  const header = Buffer.alloc(6 + images.length * 16)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(images.length, 4)
  let offset = header.length
  images.forEach(({ size, png }, index) => {
    const entry = 6 + index * 16
    header[entry] = size === 256 ? 0 : size
    header[entry + 1] = size === 256 ? 0 : size
    header.writeUInt16LE(1, entry + 4)
    header.writeUInt16LE(32, entry + 6)
    header.writeUInt32LE(png.length, entry + 8)
    header.writeUInt32LE(offset, entry + 12)
    offset += png.length
  })
  return Buffer.concat([header, ...images.map((image) => image.png)])
}

function encodeIcns(images) {
  // Modern ICNS PNG representations, including Retina variants.
  const types = {
    icp4: 16,
    icp5: 32,
    icp6: 64,
    ic07: 128,
    ic08: 256,
    ic09: 512,
    ic10: 1024,
    ic11: 32,
    ic12: 64,
    ic13: 256,
    ic14: 512
  }
  const chunks = Object.entries(types).map(([type, size]) => {
    const png = images.get(size)
    const header = Buffer.alloc(8)
    header.write(type, 0, 'ascii')
    header.writeUInt32BE(png.length + 8, 4)
    return Buffer.concat([header, png])
  })
  const header = Buffer.alloc(8)
  header.write('icns', 0, 'ascii')
  header.writeUInt32BE(8 + chunks.reduce((sum, chunk) => sum + chunk.length, 0), 4)
  return Buffer.concat([header, ...chunks])
}

app.disableHardwareAcceleration()
app
  .whenReady()
  .then(async () => {
    const svg = await fs.readFile(path.join(root, 'build/icon.svg'), 'utf8')
    const source = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
    const window = new BrowserWindow({
      show: false,
      webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false }
    })
    await window.loadURL(
      'data:text/html,<html><head><title>Icon generator</title></head><body></body></html>'
    )
    const sizes = [16, 24, 32, 48, 64, 128, 256, 512, 1024]
    const rendered = await window.webContents.executeJavaScript(`(async () => {
    const image = new Image();
    image.src = ${JSON.stringify(source)};
    await image.decode();
    return ${JSON.stringify(sizes)}.map(size => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0, size, size);
      return [size, canvas.toDataURL('image/png').split(',')[1]];
    });
  })()`)
    const images = new Map(rendered.map(([size, data]) => [size, Buffer.from(data, 'base64')]))
    for (const [size, png] of images) {
      const decoded = nativeImage.createFromBuffer(png)
      const dimensions = decoded.getSize()
      if (decoded.isEmpty() || dimensions.width !== size || dimensions.height !== size) {
        throw new Error(`Invalid rendered icon at ${size}px`)
      }
    }
    await Promise.all([
      fs.writeFile(path.join(root, 'build/icon.png'), images.get(1024)),
      fs.writeFile(path.join(root, 'resources/icon.png'), images.get(1024)),
      fs.writeFile(
        path.join(root, 'build/icon.ico'),
        encodeIco(
          sizes.filter((size) => size <= 256).map((size) => ({ size, png: images.get(size) }))
        )
      ),
      fs.writeFile(path.join(root, 'build/icon.icns'), encodeIcns(images))
    ])
    console.log(
      'Generated Signal: build/icon.png, build/icon.ico, build/icon.icns, resources/icon.png'
    )
    console.log(`Validated PNG representations: ${sizes.join(', ')}px`)
    window.destroy()
    app.quit()
  })
  .catch((error) => {
    console.error(error)
    app.exit(1)
  })
