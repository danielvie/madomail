const { existsSync } = require('fs')
const { join } = require('path')
const { spawn } = require('child_process')

function resolve_helper_path() {
  const candidate_paths = [
    join(process.cwd(), 'helper_com_rs', 'target', 'debug', 'helper_com_rs.exe'),
    join(process.cwd(), 'helper_com_rs', 'target', 'release', 'helper_com_rs.exe')
  ]

  for (const candidate_path of candidate_paths) {
    if (existsSync(candidate_path)) {
      return candidate_path
    }
  }

  throw new Error(`helper_com_rs executable not found. Checked: ${candidate_paths.join(', ')}`)
}

function start_helper() {
  const helper_path = resolve_helper_path()
  const child_process = spawn(helper_path, [], { windowsHide: true })
  let stdout_buffer = ''
  let request_count = 0
  const pending_requests = new Map()

  child_process.stdout.on('data', (chunk) => {
    stdout_buffer += chunk.toString()

    let newline_index = stdout_buffer.indexOf('\n')
    while (newline_index !== -1) {
      const line = stdout_buffer.slice(0, newline_index).trim()
      stdout_buffer = stdout_buffer.slice(newline_index + 1)

      if (line) {
        try {
          const message = JSON.parse(line)
          const request_id = message.request_id
          if (request_id && pending_requests.has(request_id)) {
            const pending = pending_requests.get(request_id)
            pending_requests.delete(request_id)
            if (message.success) {
              pending.resolve(message)
            } else {
              pending.reject(new Error(message.error || 'Unknown helper error'))
            }
          }
        } catch (error) {
          console.error('Failed to parse helper response line', line)
          console.error(error && error.message ? error.message : String(error))
        }
      }

      newline_index = stdout_buffer.indexOf('\n')
    }
  })

  child_process.stderr.on('data', (chunk) => {
    console.error(chunk.toString())
  })

  child_process.on('close', (code) => {
    for (const pending of pending_requests.values()) {
      pending.reject(new Error(`helper_com_rs exited with code ${code ?? 'unknown'}`))
    }
    pending_requests.clear()
  })

  return {
    invoke(request) {
      const request_id = `req_${++request_count}`
      const payload = { ...request, request_id }
      console.log(`Starting command: ${request.command}`)

      return new Promise((resolve, reject) => {
        const timeout_id = setTimeout(() => {
          pending_requests.delete(request_id)
          reject(new Error(`Command '${request.command}' timed out after 30000ms`))
        }, 30000)

        pending_requests.set(request_id, {
          resolve: (message) => {
            clearTimeout(timeout_id)
            console.log(`Finished command: ${request.command}`)
            resolve(message)
          },
          reject: (error) => {
            clearTimeout(timeout_id)
            reject(error)
          }
        })

        child_process.stdin.write(`${JSON.stringify(payload)}\n`, (error) => {
          if (error) {
            clearTimeout(timeout_id)
            pending_requests.delete(request_id)
            reject(error)
          }
        })
      })
    },
    stop() {
      child_process.kill()
    }
  }
}

function assert_condition(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

async function main() {
  console.log('Running Node harness against helper_com_rs')
  const helper = start_helper()

  try {
    const folder_result = await helper.invoke({
      command: 'list_folders',
      top_level_only: true,
      depth_max: 1,
      folder_count_max: 50
    })
    assert_condition(
      folder_result.success === true,
      `list_folders failed: ${folder_result.error || 'unknown error'}`
    )
    assert_condition(Array.isArray(folder_result.data), 'list_folders data must be an array')
    assert_condition(folder_result.data.length > 0, 'list_folders returned no folders')
    console.log(`Validated list_folders with ${folder_result.data.length} folders`)

    const inbox_result = await helper.invoke({ command: 'list_inbox', max_results: 10 })
    assert_condition(
      inbox_result.success === true,
      `list_inbox failed: ${inbox_result.error || 'unknown error'}`
    )
    assert_condition(Array.isArray(inbox_result.data), 'list_inbox data must be an array')
    assert_condition(inbox_result.data.length > 0, 'list_inbox returned no messages')
    console.log(`Validated list_inbox with ${inbox_result.data.length} messages`)

    const move_result = await helper.invoke({
      command: 'move_messages',
      ids: [],
      folder_path: folder_result.data[0].path
    })
    assert_condition(
      move_result.success === true,
      `move_messages failed: ${move_result.error || 'unknown error'}`
    )
    assert_condition(Array.isArray(move_result.data), 'move_messages data must be an array')
    console.log('Validated move_messages with empty batch')

    console.log(
      JSON.stringify(
        {
          ok: true,
          helper_path: resolve_helper_path(),
          folder_count: folder_result.data.length,
          inbox_count: inbox_result.data.length,
          sample_folder: folder_result.data[0],
          sample_message: inbox_result.data[0]
        },
        null,
        2
      )
    )
  } finally {
    helper.stop()
  }
}

main().catch((error) => {
  console.error('Node helper_com_rs harness failed')
  console.error(error && error.message ? error.message : String(error))
  process.exit(1)
})
