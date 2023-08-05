let editor = document.getElementById("editor")
let editorRect = editor.getBoundingClientRect()
let addSlackBusBtn = document.getElementById("add-slack-bus-btn")
let addGeneratorBusBtn = document.getElementById("add-generator-bus-btn")
let addLoadBusBtn = document.getElementById("add-load-bus-btn")
let perUnitCheckBox = document.getElementById("per-unit-checkbox")
let perUnitDiv = document.getElementById("per-unit-div")
let baseVoltageInput = document.getElementById("base-voltage-input")
let basePowerInput = document.getElementById("base-power-input")
let calcPFBtn = document.getElementById("calc-pf-btn")
let pfMethodInput = document.getElementById("pf-method-input")
let componentPropertiesDiv = document.getElementById("component-properties-div")
let updateComponentPropertiesBtn = document.getElementById("update-component-properties-btn")
let iterLimitInput = document.getElementById("iter-limit-input")
let fileUpload = document.getElementById("file-data")

let busProperties = {}
let lineProperties = {}
let network = { buses: {}, lines: {} }

// divs should carry active and passive class
// divs should be inside activeComponent and passiveComponent
// for a bus, the busDiv should be selectable and moveable
// for a line, the linesvg should be selectable but not moveable
// svgs should have class bus and line
// divs should have class busDiv and lineDiv and id bus-# and line-#
// active and passive components are independent of one another
// drawLine should not work when a line is active or passive
let activeComponent = null
let passiveComponent = null
let perUnitCheckBoxValue = "off"

// keep component numbers consistent
// all buses except slack bus should have an initial guess
function addBus(e) {
  let addBusBtnId = e.target.id

  let busDiv = document.createElement("div")
  let count = Object.keys(network.buses).length + 1

  busDiv.id = "busDiv" + "-" + count
  busDiv.classList.add("busDiv")
  busDiv.style.position = "absolute"
  busDiv.style.top = "250px"
  busDiv.style.left = "400px"
  busDiv.draggable = true

  if (addBusBtnId === "add-slack-bus-btn") {
    busDiv.classList.add("slack-bus-div")
    busDiv.innerHTML = `<svg class="bus" width="50" height="50" xmlns="http://www.w3.org/2000/svg">
    <g>
     <ellipse stroke=" rgb(0, 0, 0)" fill=" rgb(216, 216, 216)" ry="11.538" rx="11.628" cy="25.69662" cx="33.11137"/>
     <path stroke=" rgb(0, 0, 0)" fill=" rgb(216, 216, 216)" d="m3.14137,25.56862c0.056,0.001 20.525,0.086 17.647,0.015"/>
     <text font-size=" 21.2px" font-family=" Arial, sans-serif" fill=" rgb(51, 51, 51)" transform="matrix(0.398682 0 0 0.459256 50.29 64.544)" y="-121.93734" x="-126.1407">Bus</text>
     <path class="busbar" stroke=" rgb(0, 0, 0)" fill=" rgb(216, 216, 216)" d="m2.72037,10.57162l0,30.952"/>
     <text font-size=" 6px" font-family=" Arial, sans-serif" fill=" rgb(51, 51, 51)" y="67.27462" x="79.7804" transform="matrix(0.765263 0 0 1 -56.7741 -19.4816)">Phi=0</text>
     <text font-size=" 6px" font-family=" Arial, sans-serif" fill=" rgb(51, 51, 51)" y="67.27462" x="69.04051" transform="matrix(0.701289 0 0 1 -43.5546 -25.1696)">V=0</text>
    </g>
  </svg>
  `
  } else if (addBusBtnId === "add-generator-bus-btn") {
    busDiv.classList.add("generator-bus-div")
    busDiv.innerHTML = `<svg class="bus" width="50" height="50" xmlns="http://www.w3.org/2000/svg"><g><ellipse stroke=" rgb(0, 0, 0)" fill=" rgb(216, 216, 216)" ry="11.538" rx="11.628" cy="25.38218" cx="32.8131"/><path stroke=" rgb(0, 0, 0)" fill=" rgb(216, 216, 216)" d="m2.8431,25.25418c0.056,0.001 20.525,0.086 17.647,0.015"/><path class="busbar" stroke=" rgb(0, 0, 0)" fill=" rgb(216, 216, 216)" d="m2.4221,10.25718l0,30.952"/><path stroke=" rgb(0, 0, 0)" fill=" rgb(216, 216, 216)" d="m2.4211,15.22818l17.827,0"/><path stroke=" rgb(0, 0, 0)" fill=" rgb(216, 216, 216)" d="m15.7921,11.72618l5.729,3.82"/><path stroke=" rgb(0, 0, 0)" fill=" rgb(216, 216, 216)" d="m21.1631,15.22718l-5.014,3.502"/><text font-size=" 21.2px" font-family=" Arial, sans-serif" fill=" rgb(51, 51, 51)" transform="matrix(0.398682 0 0 0.459256 147.359 66.2805)" y="-125.71831" x="-369.61612">Bus</text><text font-size=" 6px" font-family=" Arial, sans-serif" fill=" rgb(51, 51, 51)" y="65.53818" x="-76.65402" transform="matrix(0.68267 0 0 1 56.3873 -17.5184)">V=0</text><text font-size=" 6px" font-family=" Arial, sans-serif" fill=" rgb(51, 51, 51)" y="65.84992" x="-56.00726" transform="matrix(0.738267 0 0 1.00297 45.3815 -24.0638)">P=0</text></g></svg>`
  } else if (addBusBtnId === "add-load-bus-btn") {
    busDiv.classList.add("load-bus-div")
    busDiv.innerHTML = `<svg class="bus" width="50" height="50" xmlns="http://www.w3.org/2000/svg">
    <g>
     <text font-size=" 6px" font-family=" Arial, sans-serif" fill=" rgb(51, 51, 51)" y="170.916" x="197.512" transform="matrix(0.682112 0 0 1 -130.678 -122.631)">Q=0</text>
     <text font-size=" 6px" font-family=" Arial, sans-serif" fill=" rgb(51, 51, 51)" y="-0.08006" x="47.04211" transform="matrix(0.69208 0 0 1 -28.3811 42.3224)">P=0</text>
     <path class="busbar" stroke=" rgb(0, 0, 0)" fill=" rgb(216, 216, 216)" d="m3.15679,10.65894l-0.319,30.243"/>
     <path stroke=" rgb(0, 0, 0)" fill=" rgb(216, 216, 216)" d="m28.62379,13.47594l5.729,3.82"/>
     <path stroke=" rgb(0, 0, 0)" fill=" rgb(216, 216, 216)" d="m34.33379,16.62594l-5.014,3.502"/>
     <path stroke=" rgb(0, 0, 0)" fill=" rgb(216, 216, 216)" d="m3.47579,17.02594l30.689,0"/>
     <path stroke=" rgb(0, 0, 0)" fill=" rgb(216, 216, 216)" d="m29.63579,28.77594l5.729,3.82"/>
     <path stroke=" rgb(0, 0, 0)" fill=" rgb(216, 216, 216)" d="m35.01779,32.45194l-5.014,3.502"/>
     <path stroke=" rgb(0, 0, 0)" fill=" rgb(216, 216, 216)" d="m3.15679,31.98894l32.073,0.318"/>
     <text font-size=" 21.2px" font-family=" Arial, sans-serif" fill=" rgb(51, 51, 51)" transform="matrix(0.398682 0 0 0.459256 64.3316 131.993)" y="-268.59776" x="-161.36068">Bus</text>
    </g>
  </svg>
  `
  }

  makeComponentSelectable(busDiv)
  makeComponentMoveable(busDiv)
  initializeComponent(busDiv)
  updateSelectedComponents(busDiv, null)
  editor.appendChild(busDiv)
}

function updateSelectedComponents(newActive, newPassive) {
  if (passiveComponent) {
    passiveComponent.classList.remove("passive")
  }

  if (newPassive) {
    newPassive.classList.add("passive")
  }

  passiveComponent = newPassive
  
  if (activeComponent) {
    activeComponent.classList.remove("active")
  }

  if (newActive) {
    newActive.classList.add("active")
  }

  activeComponent = newActive

  toggleDisplayComponentPropertiesInput()
}

function initializeComponent(componentDiv) {
  if (componentDiv.classList.contains("lineDiv")) {
    console.log("adding", componentDiv.id, "to", activeComponent.id, passiveComponent.id)
    network.lines[componentDiv.id] = [activeComponent.id, passiveComponent.id]
    network.buses[activeComponent.id].push(componentDiv.id)
    network.buses[passiveComponent.id].push(componentDiv.id)
  } else {
    network.buses[componentDiv.id] = []
  }
}


function deleteLine(lineDiv) {
  editor.removeChild(lineDiv)
  console.log("deleting", lineDiv.id)

  let connectedBuses = network.lines[lineDiv.id]

  for (let busId of connectedBuses) {
    // remove line from from records
    console.log("removing", lineDiv.id, "from", busId)
    let position = network.buses[busId].findIndex((lineId) => { lineId === lineDiv.id })
    network.buses[busId].splice(position, 1)
  }

  delete lineProperties[lineDiv.id]
  delete network.lines[lineDiv.id]

  console.log(network.lines)
}

// fix error when deleting active and passive bus with line
function deleteBus(busDiv) {
  editor.removeChild(busDiv)
  console.log("deleting", busDiv.id)

  let connectedLines = network.buses[busDiv.id]

  for (let lineId of connectedLines) {
    // remove bus from line records
    console.log("removing", busDiv.id, "from", lineId)

    let position = network.lines[lineId].findIndex((busId) => { busId === busDiv.id })
    network.lines[lineId].splice(position, 1)

    // delete line
    deleteLine(document.getElementById(lineId))
  }

  delete busProperties[busDiv.id]
  delete network.buses[busDiv.id]

  console.log(network.buses)
}

// fix error when deleting active and passive bus with lines
function handleKeyDown(e) {
  if (e.key === "Escape") {
    updateSelectedComponents(null, null)
    return
  }

  if (e.key === "Delete") {
    if (activeComponent) {
      if (activeComponent.classList.contains("lineDiv")) {
        deleteLine(activeComponent)
      } else {
        deleteBus(activeComponent)
      }
    }

    if (passiveComponent) {
      if (passiveComponent.classList.contains("lineDiv")) {
        deleteLine(passiveComponent)
      } else {
        deleteBus(passiveComponent)
      }
    }

    updateSelectedComponents(null, null)

    return
  }

  if (e.key === "l") {
    if (activeComponent && passiveComponent) {
      if (activeComponent.classList.contains("lineDiv") || passiveComponent.classList.contains("lineDiv")) {
        alert("Can't draw line")
        return
      }

      for (let [startBusId, endBusId] of Object.values(network.lines)) {
        if (((startBusId === activeComponent.id) && (endBusId === passiveComponent.id)) || ((startBusId === passiveComponent.id) && (endBusId === activeComponent.id))) {
          alert("Can't draw line")
          return
        }
      }

      let lineDiv = createLine(activeComponent, passiveComponent)

      makeComponentSelectable(lineDiv)
      initializeComponent(lineDiv)
      updateSelectedComponents(lineDiv, null)
      editor.appendChild(lineDiv)
    }
  }
}

function toggleDisplayBaseValuesInput(e) {
  if (e.currentTarget.checked) {
    basePowerInput.disabled = false
    baseVoltageInput.disabled = false
    perUnitDiv.style.display = "flex"
    perUnitDiv.style.flexDirection = "column"
    perUnitCheckBoxValue = "on"
  } else {
    basePowerInput.value = ""
    basePowerInput.disabled = true
    baseVoltageInput.value = ""
    baseVoltageInput.disabled = true
    perUnitDiv.style.display = "none"
    perUnitCheckBoxValue = "off"
  }
}

async function calculatePowerFlow(e) {
  function networkIsValid() {
    // check that there is only one slack buss
    // check that all component values are initialized
    // check that all components are connected with lines
    // check that editor is not empty
    // check that pf method exists
    return true
  }

  function updateWithPowerFlow(data) {

  }

  async function downloadFile(response) {
    if (response.ok) {
      if (response.ok) {
        const filename = "results.xlsx"
  
        let blob = await response.blob()
          const downloadUrl = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = downloadUrl
          a.download = filename
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          window.URL.revokeObjectURL(downloadUrl)
      } else {
        alert("Power flow analysis failed");
      }
    }
  }

  if (!networkIsValid()) {
    alert("Can't do power flow")
    return
  }

  console.log(JSON.stringify({ bus_properties: busProperties, line_properties: lineProperties, network }))

  if (fileUpload.files && fileUpload.files[0]) {
    let file = fileUpload.files[0]
    let formData = new FormData()
    formData.append('file', file)
    let options = {
      method: 'POST',
      body: formData
    }
    let response = await fetch(`/file?pf_method=${pfMethodInput.value}&iter_limit=${(iterLimitInput.value === "") ? 100 : iterLimitInput.value}`, options)

    await downloadFile(response)
    return
  }

  let options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ bus_properties: busProperties, line_properties: lineProperties, network })
  }

  let response = await fetch(`/power_flow?convert_to_per_unit=${perUnitCheckBoxValue === "on"}&base_voltage=${(baseVoltageInput.value === "") ? 0 : baseVoltageInput.value}&base_power=${(basePowerInput.value === "") ? 0 : basePowerInput.value}&iter_limit=${(iterLimitInput.value === "") ? 50 : iterLimitInput.value}&pf_method=${pfMethodInput.value}`, options)
  await downloadFile(response)
}

function updateComponentProperties(e) {
  let val1 = document.getElementById("value-1")
  let val2 = document.getElementById("value-2")

  if (activeComponent.classList.contains("slack-bus-div")) {
    busProperties[activeComponent.id] = { voltage: val1.value, phase_angle: val2.value, type: "slack_bus" }
  } else if (activeComponent.classList.contains("generator-bus-div")) {
    busProperties[activeComponent.id] = { real_power: val1.value, voltage: val2.value, type: "generator_bus" }
  } else if (activeComponent.classList.contains("load-bus-div")) {
    busProperties[activeComponent.id] = { real_power: val1.value, reactive_power: val2.value, type: "load_bus" }
  } else {
    lineProperties[activeComponent.id] = { resistance: val1.value, reactance: val2.value }
  }
}

function toggleDisplayComponentPropertiesInput() {
  let val1Div = document.getElementById("value-1-div")
  let val2Div = document.getElementById("value-2-div")
  
  if (activeComponent) {
    if (activeComponent.classList.contains("busDiv")) {
      let componentValues = busProperties[activeComponent.id]
      if (activeComponent.classList.contains("slack-bus-div")) {
        val1Div.innerHTML = `<label for="value-1">Voltage (KV)</label><input type="number" step="0.0001" name="value-1" id="value-1" value=${(componentValues && componentValues.voltage) ? componentValues.voltage : ""}>`
        val2Div.innerHTML = `<label for="value-2">Phase Angle (Deg)</label><input type="number" step="0.0001" name="value-2" id="value-2" value=${(componentValues && componentValues.phase_angle) ? componentValues.phase_angle : ""}>`
      } else if (activeComponent.classList.contains("generator-bus-div")) {
        val1Div.innerHTML = `<label for="value-1">Real Power (MW)</label><input type="number" step="0.0001" name="value-1" id="value-1" value=${(componentValues && componentValues.real_power) ? componentValues.real_power : ""}>`
        val2Div.innerHTML = `<label for="value-2">Voltage (KV)</label><input type="number" step="0.0001" name="value-2" id="value-2" value=${(componentValues && componentValues.voltage) ? componentValues.voltage : ""}>`
      } else if (activeComponent.classList.contains("load-bus-div")) {
        val1Div.innerHTML = `<label for="value-1">Real Power (MW)</label><input type="number" step="0.0001" name="value-1" id="value-1" value=${(componentValues && componentValues.real_power) ? componentValues.real_power : ""}>`
        val2Div.innerHTML = `<label for="value-2">Reactive Power (MW)</label><input type="number" step="0.0001" name="value-2" id="value-2" value=${(componentValues && componentValues.reactive_power) ? componentValues.reactive_power : ""}>`
      }
    } else {
      let componentValues = lineProperties[activeComponent.id]
      val1Div.innerHTML = `<label for="value-1">Resistance (Ohm)</label><input type="number" step="0.0001" name="value-1" id="value-1" value=${(componentValues && componentValues.resistance) ? componentValues.resistance : ""}>`
      val2Div.innerHTML = `<label for="value-2">Reactance (Ohm)</label><input type="number" step="0.0001" name="value-2" id="value-2" value=${(componentValues && componentValues.reactance) ? componentValues.reactance : ""}>`
    }

    componentPropertiesDiv.style.display = "block"
  } else {
    val1Div.innerHTML = ``
    val2Div.innerHTML = ``
    componentPropertiesDiv.style.display = "none"
  }
}

// busDiv is made moveable
function makeComponentMoveable(componentDiv) {
  let offsetX, offsetY, componentDivRect = null

  componentDiv.addEventListener("dragstart", dragStart)
  componentDiv.addEventListener("dragend", dragEnd)

  function dragStart(e) {
    componentDivRect = componentDiv.getBoundingClientRect()
    offsetX = e.clientX - componentDivRect.left
    offsetY = e.clientY - componentDivRect.top
  }

  function dragEnd(e) {
    let newX = e.clientX - offsetX
    let newY = e.clientY - offsetY

    if ((newX + componentDivRect.width) > editorRect.right) newX = editorRect.right - componentDivRect.width
    if ((newY + componentDivRect.height) > editorRect.bottom) newY = editorRect.bottom - componentDivRect.height
    if (newX < editorRect.left) newX = editorRect.left
    if (newY < editorRect.top) newY = editorRect.top

    componentDiv.style.left = newX - editorRect.left + "px"
    componentDiv.style.top = newY - editorRect.top + "px"

    let connectedLineIds = network.buses[componentDiv.id]

    for (let lineId of connectedLineIds) {
      let lineDiv = document.getElementById(lineId)
      let startBus = document.getElementById(network.lines[lineId][0])
      let endBus = document.getElementById(network.lines[lineId][1])
      drawLine(startBus, endBus, lineDiv)
      makeComponentSelectable(lineDiv)
    }

    updateSelectedComponents(componentDiv, null)
  }
}

// lineSvg and busDiv are made selectable
function makeComponentSelectable(componentDiv) {
  let component = null

  if (componentDiv.classList.contains("lineDiv")) {
    component = componentDiv.querySelector("path")
  } else {
    component = componentDiv
  }

  component.addEventListener("dblclick", (e) => {
    if (e.ctrlKey) {
      updateSelectedComponents(activeComponent, componentDiv)

      if (activeComponent === passiveComponent) {
        updateSelectedComponents(null, componentDiv)
      }
    } else {
      updateSelectedComponents(componentDiv, passiveComponent)

      if (activeComponent === passiveComponent) {
        updateSelectedComponents(componentDiv, null)
      } 
    }
  })
}

function createLine(startBus, endBus) {
  let lineDiv = document.createElement("div")
  let count = Object.keys(network.lines).length + 1

  lineDiv.id = "lineDiv" + "-" + count
  lineDiv.classList.add("lineDiv")

  lineDiv.style.position = "absolute"
  lineDiv.style.pointerEvents = "none"

  lineDiv = drawLine(startBus, endBus, lineDiv)

  return lineDiv
}

// line doesnt show when components are parallel or perpendicular
// redraw line flops on small screeens
function drawLine(startBus, endBus, lineDiv) {
  let startBusbar = startBus.querySelector(".busbar")
  let endBusbar = endBus.querySelector(".busbar")

  let startBusbarRect = startBusbar.getBoundingClientRect()
  let endBusbarRect = endBusbar.getBoundingClientRect()

  let startBusbarCentre = [(startBusbarRect.width / 2) + startBusbarRect.left, (startBusbarRect.height / 2) + startBusbarRect.top]
  let endBusbarCentre = [(startBusbarRect.width / 2) + endBusbarRect.left, (endBusbarRect.height / 2) + endBusbarRect.top]

  let width = Math.abs(endBusbarCentre[0] - startBusbarCentre[0])
  lineDiv.style.width = width + "px"

  let height = Math.abs(endBusbarCentre[1] - startBusbarCentre[1])
  lineDiv.style.height = height + "px"

  let top = Math.min(startBusbarCentre[1], endBusbarCentre[1])
  lineDiv.style.top = (top - editorRect.top) + "px"

  let left = Math.min(startBusbarCentre[0], endBusbarCentre[0])
  lineDiv.style.left = (left - editorRect.left) + "px"

  let start = []
  let end = []

  if ((startBusbarCentre[1] === top && startBusbarCentre[0] === left) || (endBusbarCentre[1] === top && endBusbarCentre[0] === left)) {
    start[0] = 0
    start[1] = 0
    end[0] = width
    end[1] = height
  } else {
    start[0] = 0
    start[1] = height
    end[0] = width
    end[1] = -1 * height
  }

  lineDiv.innerHTML = `<svg class="line" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><g><path d="m${start[0]},${start[1]}l${end[0]},${end[1]}z" stroke="#000" stroke-width="1" fill="#000000"/></g></svg>`

  let line = lineDiv.querySelector("path")
  line.style.pointerEvents = "all"

  return lineDiv
}

addSlackBusBtn.addEventListener("click", addBus)
addGeneratorBusBtn.addEventListener("click", addBus)
addLoadBusBtn.addEventListener("click", addBus)
perUnitCheckBox.addEventListener("change", toggleDisplayBaseValuesInput)
calcPFBtn.addEventListener("click", calculatePowerFlow)
document.addEventListener("keydown", handleKeyDown)
updateComponentPropertiesBtn.addEventListener("click", updateComponentProperties)

componentPropertiesDiv.style.display = "none"
addSlackBusBtn.querySelector("svg").style.pointerEvents = "none"
addGeneratorBusBtn.querySelector("svg").style.pointerEvents = "none"
addLoadBusBtn.querySelector("svg").style.pointerEvents = "none"
perUnitDiv.style.display = "none"
