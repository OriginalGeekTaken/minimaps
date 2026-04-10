const imageBasePath = "./minimaps";

const minimaps = [
  "akkad-kalaazar.png",
  "callisto-sinai-io.png",
  "coba-lith.png",
  "cytherean-xini.png",
  "gaia1.png",
  "gaia2.png",
  "mithra-taranis-belenus.png",
  "munio.png",
  "oestrus.png",
  "rhea-lares-sangeru.png",
  "stolfer.png",
  "tyana_pass.png",
  "umbriel-stephano.png"
];

const markerStyles = {
  enemy: { label: "enemy spawn", radius: 9, fill: "#dc2626", stroke: "#ffffff", strokeWidth: 2 },
  atomicycle: { label: "atomicycle spot", radius: 9, fill: "#16a34a", stroke: "#ffffff", strokeWidth: 2 },
  capture: { label: "capture point", radius: 14, fill: "rgba(37, 99, 235, 0.12)", stroke: "#2563eb", strokeWidth: 4 }
};

const state = {
  currentIndex: 0,
  activeTool: "enemy",
  markersByMap: Object.fromEntries(minimaps.map((name) => [name, []])),
  completed: Object.fromEntries(minimaps.map((name) => [name, false])),
  idCounter: 0
};

const elements = {
  mapList: document.getElementById("map-list"),
  mapTitle: document.getElementById("map-title"),
  mapImage: document.getElementById("map-image"),
  markerLayer: document.getElementById("marker-layer"),
  mapStage: document.getElementById("map-stage"),
  progressText: document.getElementById("progress-text"),
  prevButton: document.getElementById("prev-button"),
  nextButton: document.getElementById("next-button"),
  toolButtons: Array.from(document.querySelectorAll(".tool-button")),
  editorScreen: document.getElementById("editor-screen"),
  finalScreen: document.getElementById("final-screen"),
  usernameInput: document.getElementById("username-input"),
  sanitizedPreview: document.getElementById("sanitized-preview"),
  submitButton: document.getElementById("submit-button"),
  submitStatus: document.getElementById("submit-status"),
  backToMaps: document.getElementById("back-to-maps")
};

function getCurrentMapName() {
  return minimaps[state.currentIndex];
}

function getUsername(value) {
  return value.trim();
}

function renderSidebar() {
  elements.mapList.innerHTML = "";

  minimaps.forEach((name, index) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "map-item";

    if (index === state.currentIndex && elements.editorScreen.classList.contains("active")) {
      item.classList.add("active");
    }

    if (state.completed[name]) {
      item.classList.add("complete");
    }

    item.innerHTML = `
      <span>${name}</span>
      <span class="map-check">${state.completed[name] ? "&#10003;" : ""}</span>
    `;

    item.addEventListener("click", () => {
      showEditor();
      markCurrentComplete();
      state.currentIndex = index;
      render();
    });

    elements.mapList.appendChild(item);
  });

  const finalItem = document.createElement("button");
  finalItem.type = "button";
  finalItem.className = "map-item";
  finalItem.innerHTML = `<span>Final submit</span><span class="map-check">${allMapsComplete() ? "&#10003;" : ""}</span>`;
  if (elements.finalScreen.classList.contains("active")) {
    finalItem.classList.add("active");
  }
  finalItem.addEventListener("click", () => {
    if (allMapsComplete()) {
      showFinalScreen();
    }
  });
  elements.mapList.appendChild(finalItem);
}

function updateProgress() {
  const count = minimaps.filter((name) => state.completed[name]).length;
  elements.progressText.textContent = `${count} / ${minimaps.length} complete`;
}

function setActiveTool(toolName) {
  state.activeTool = toolName;
  elements.toolButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.tool === toolName);
  });
  renderMarkers();
}

function renderMarkers() {
  const mapName = getCurrentMapName();
  const markers = state.markersByMap[mapName];
  elements.markerLayer.innerHTML = "";

  markers.forEach((marker) => {
    const markerEl = document.createElement("button");
    markerEl.type = "button";
    markerEl.className = `marker ${marker.type}`;
    markerEl.style.left = `${marker.x * 100}%`;
    markerEl.style.top = `${marker.y * 100}%`;
    markerEl.dataset.markerId = marker.id;
    markerEl.title = markerStyles[marker.type].label;

    if (state.activeTool === "delete") {
      markerEl.classList.add("delete-hover");
    }

    markerEl.addEventListener("click", (event) => {
      event.stopPropagation();
      if (state.activeTool === "delete") {
        deleteMarker(marker.id);
      }
    });

    attachDrag(markerEl, marker);
    elements.markerLayer.appendChild(markerEl);
  });
}

function renderCurrentMap() {
  const mapName = getCurrentMapName();
  elements.mapTitle.textContent = mapName;
  elements.mapImage.src = `${imageBasePath}/${encodeURIComponent(mapName)}`;
  elements.mapImage.alt = mapName;
  elements.prevButton.disabled = state.currentIndex === 0;
  elements.nextButton.textContent = state.currentIndex === minimaps.length - 1 ? "Review & submit" : "Next";
  renderMarkers();
}

function render() {
  renderSidebar();
  updateProgress();
  renderCurrentMap();
}

function allMapsComplete() {
  return minimaps.every((name) => state.completed[name]);
}

function markCurrentComplete() {
  state.completed[getCurrentMapName()] = true;
  updateProgress();
}

function getRelativeCoordinates(event) {
  const rect = elements.markerLayer.getBoundingClientRect();
  const x = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
  const y = Math.min(Math.max((event.clientY - rect.top) / rect.height, 0), 1);
  return { x, y };
}

function addMarker(event) {
  if (state.activeTool === "delete") {
    return;
  }

  const coords = getRelativeCoordinates(event);
  const mapName = getCurrentMapName();
  state.markersByMap[mapName].push({
    id: `marker-${state.idCounter += 1}`,
    type: state.activeTool,
    x: coords.x,
    y: coords.y
  });
  renderMarkers();
}

function deleteMarker(markerId) {
  const mapName = getCurrentMapName();
  state.markersByMap[mapName] = state.markersByMap[mapName].filter((marker) => marker.id !== markerId);
  renderMarkers();
}

function attachDrag(markerEl, marker) {
  markerEl.addEventListener("pointerdown", (event) => {
    if (state.activeTool === "delete") {
      return;
    }

    event.preventDefault();
    markerEl.classList.add("dragging");
    markerEl.setPointerCapture(event.pointerId);

    const onMove = (moveEvent) => {
      const coords = getRelativeCoordinates(moveEvent);
      marker.x = coords.x;
      marker.y = coords.y;
      markerEl.style.left = `${coords.x * 100}%`;
      markerEl.style.top = `${coords.y * 100}%`;
    };

    const onUp = () => {
      markerEl.classList.remove("dragging");
      markerEl.removeEventListener("pointermove", onMove);
      markerEl.removeEventListener("pointerup", onUp);
      markerEl.removeEventListener("pointercancel", onUp);
    };

    markerEl.addEventListener("pointermove", onMove);
    markerEl.addEventListener("pointerup", onUp);
    markerEl.addEventListener("pointercancel", onUp);
  });
}

function showEditor() {
  elements.editorScreen.classList.add("active");
  elements.finalScreen.classList.remove("active");
  renderSidebar();
}

function showFinalScreen() {
  elements.finalScreen.classList.add("active");
  elements.editorScreen.classList.remove("active");
  renderSidebar();
}

async function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function drawMarker(ctx, marker, width, height) {
  const style = markerStyles[marker.type];
  const x = marker.x * width;
  const y = marker.y * height;

  ctx.beginPath();
  ctx.arc(x, y, style.radius, 0, Math.PI * 2);
  ctx.fillStyle = style.fill;
  ctx.fill();
  ctx.lineWidth = style.strokeWidth;
  ctx.strokeStyle = style.stroke;
  ctx.stroke();
}

async function buildExportFiles() {
  const files = [];

  for (const mapName of minimaps) {
    const image = await loadImage(`${imageBasePath}/${encodeURIComponent(mapName)}`);
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext("2d");

    ctx.drawImage(image, 0, 0);
    state.markersByMap[mapName].forEach((marker) => {
      drawMarker(ctx, marker, canvas.width, canvas.height);
    });

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    files.push({ name: mapName, blob });
  }

  const manifest = minimaps.map((mapName) => ({
    filename: mapName,
    markers: state.markersByMap[mapName].map(({ type, x, y }) => ({ type, x, y }))
  }));

  files.push({
    name: "placements.json",
    blob: new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), maps: manifest }, null, 2)], {
      type: "application/json"
    })
  });

  return files;
}

async function saveWithFileSystemAccess(folderName, files) {
  const parentHandle = await window.showDirectoryPicker();
  const exportDir = await parentHandle.getDirectoryHandle(folderName, { create: true });

  for (const file of files) {
    const fileHandle = await exportDir.getFileHandle(file.name, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(file.blob);
    await writable.close();
  }
}

async function saveAsZip(folderName, files) {
  if (!window.JSZip) {
    throw new Error("Zip export dependency failed to load.");
  }

  const zip = new window.JSZip();
  const folder = zip.folder(folderName);
  files.forEach((file) => folder.file(file.name, file.blob));
  const content = await zip.generateAsync({ type: "blob" });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(content);
  link.download = `${folderName}.zip`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1500);
}

async function submitExport() {
  const username = getUsername(elements.usernameInput.value);
  if (!username) {
    return;
  }

  elements.submitButton.disabled = true;
  elements.submitStatus.textContent = "Preparing annotated minimaps...";

  try {
    const files = await buildExportFiles();

    if ("showDirectoryPicker" in window) {
      elements.submitStatus.textContent = "Choose a parent folder for the export.";
      await saveWithFileSystemAccess(username, files);
      elements.submitStatus.textContent = `Saved "${username}" with ${files.length - 1} annotated images and placements.json.`;
    } else {
      elements.submitStatus.textContent = "Saving a zip download because direct folder export is not available in this browser.";
      await saveAsZip(username, files);
      elements.submitStatus.textContent = `Downloaded ${username}.zip with all annotated minimaps.`;
    }
  } catch (error) {
    if (error && error.name === "AbortError") {
      elements.submitStatus.textContent = "Export cancelled.";
    } else {
      elements.submitStatus.textContent = `Export failed: ${error.message}`;
    }
  } finally {
    elements.submitButton.disabled = !getUsername(elements.usernameInput.value);
  }
}

elements.markerLayer.addEventListener("click", addMarker);

elements.toolButtons.forEach((button) => {
  button.addEventListener("click", () => setActiveTool(button.dataset.tool));
});

elements.prevButton.addEventListener("click", () => {
  markCurrentComplete();
  state.currentIndex = Math.max(state.currentIndex - 1, 0);
  render();
});

elements.nextButton.addEventListener("click", () => {
  markCurrentComplete();

  if (state.currentIndex === minimaps.length - 1) {
    showFinalScreen();
    return;
  }

  state.currentIndex += 1;
  render();
});

elements.backToMaps.addEventListener("click", () => {
  showEditor();
});

elements.usernameInput.addEventListener("input", () => {
  const username = getUsername(elements.usernameInput.value);
  elements.sanitizedPreview.textContent = username
    ? `Folder name preview: ${username}`
    : "Folder name preview: waiting for input";
  elements.submitButton.disabled = !username;
  elements.submitStatus.textContent = "";
});

elements.submitButton.addEventListener("click", submitExport);

elements.mapImage.addEventListener("dragstart", (event) => event.preventDefault());

render();
setActiveTool("enemy");
