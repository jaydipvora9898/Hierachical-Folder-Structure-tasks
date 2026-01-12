
const container = document.getElementById("container");
const popupContainer = document.getElementById("popupContainer");
const popup = document.getElementById("popup");
const popupLabel = document.getElementById("popupLabel");
const folderNameInput = document.getElementById("folderNameInput");
const folderNameError = document.getElementById("folderNameError");
const folderCreateButton = document.getElementById("folderCreateButton");
const deleteContainer = document.getElementById("deleteContainer");
const deleteFolderButton = document.getElementById("deleteFolderButton");
const deleteFolderCancelButton = document.getElementById("deleteFolderCancelButton");

let pendingDeleteId = null;
let pendingRenameId = null;
let isRenameMode = false;

let folderData = {
    id: 101,
    parentId: null,
    name: "Root Folder",
    childrens: [],
};
function saveToLocalStorage() {
    localStorage.setItem("folderData", JSON.stringify(folderData));
}

function loadFromLocalStorage() {
    const data = JSON.parse(localStorage.getItem("folderData"));
    if (data) {
        folderData = data;
    }
    renderFolders();
}

loadFromLocalStorage();

function findFolderById(id, folder) {
    if (folder.id === id) return folder;

    for (let child of folder.childrens) {
        const found = findFolderById(id, child);
        if (found) return found;
    }
    return null;
}

function showFolderNameField() {
    if (!popupContainer || !popup) return;
    isRenameMode = false;
    pendingRenameId = null;
    if (popupLabel) popupLabel.textContent = "Create New Folder";
    if (folderNameInput) folderNameInput.value = "";
    if (folderNameError) folderNameError.classList.add("hidden");

    popupContainer.classList.remove("hidden", "opacity-0", "pointer-events-none");
    popupContainer.classList.add("flex");
    popup.classList.remove("hidden");

    if (folderNameInput) folderNameInput.focus();
}

function editFolderName(id) {
    if (!popupContainer || !popup) return;
    isRenameMode = true;
    pendingRenameId = id;
    const f = findFolderById(id, folderData);
    if (popupLabel) popupLabel.textContent = "Rename Folder";
    if (folderNameInput) folderNameInput.value = f ? f.name : "";
    if (folderNameError) folderNameError.classList.add("hidden");

    popupContainer.classList.remove("hidden", "opacity-0", "pointer-events-none");
    popupContainer.classList.add("flex");
    popup.classList.remove("hidden");
    if (folderNameInput) folderNameInput.focus();
}

function popupRemove() {
    if (!popupContainer) return;
    popupContainer.classList.add("opacity-0", "pointer-events-none");
    popupContainer.classList.remove("flex");
    setTimeout(() => {
        popupContainer.classList.add("hidden");
        if (deleteContainer) deleteContainer.classList.add("hidden");
        if (popup) popup.classList.remove("hidden");
    }, 200);
    isRenameMode = false;
    pendingRenameId = null;
}

function handleCreateFromPopup() {
    if (!folderNameInput) return;
    const folderName = folderNameInput.value;
    const validName = folderName && folderName.trim();
    if (!validName) {
        if (folderNameError) folderNameError.classList.remove("hidden");
        return;
    }

    if (isRenameMode && pendingRenameId != null) {
        const f = findFolderById(pendingRenameId, folderData);
        if (f) {
            f.name = validName.trim();
            saveToLocalStorage();
            renderFolders();
        }
    } else {
        createFolder(folderData.id, validName);
    }
    popupRemove();
}

if (folderCreateButton) folderCreateButton.addEventListener("click", handleCreateFromPopup);
if (folderNameInput) {
    folderNameInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") handleCreateFromPopup();
        if (e.key === "Escape") popupRemove();
    });
}
if (deleteFolderButton) {
    deleteFolderButton.addEventListener("click", () => {
        if (pendingDeleteId != null) {
            removeFromTree(folderData, pendingDeleteId);
            saveToLocalStorage();
            renderFolders();
            pendingDeleteId = null;
        }
        popupRemove();
    });
}
if (deleteFolderCancelButton) {
    deleteFolderCancelButton.addEventListener("click", popupRemove);
}

function createFolder(parentId, folderName) {
    if (!folderName || !folderName.trim()) return;

    const parentFolder = findFolderById(parentId, folderData);
    if (!parentFolder) return;

    const newFolder = {
        id: Date.now(),
        parentId: parentId,
        name: folderName.trim(),
        childrens: []
    };

    parentFolder.childrens.push(newFolder);
    saveToLocalStorage();
    renderFolders();
}

function renderFolder(folder) {
    const wrapper = document.createElement("div");
    wrapper.className = "space-y-2";

    const row = document.createElement("div");
    row.className = "flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm";

    const iconWrap = document.createElement("div");
    iconWrap.className = "flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600";
    iconWrap.innerHTML = '<i class="ri-folder-fill"></i>';

    const nameEl = document.createElement("div");
    nameEl.className = "text-sm font-medium text-slate-800";
    nameEl.textContent = folder.name;

    const actions = document.createElement("div");
    actions.className = "ml-auto";
    const editBtn = document.createElement("button");
    editBtn.className = "rounded-full p-2 text-slate-400 hover:text-yellow-600 hover:bg-yellow-50 transition";
    editBtn.innerHTML = '<i class="ri-edit-line"></i>';
    editBtn.addEventListener("click", () => editFolderName(folder.id));
    const delBtn = document.createElement("button");
    delBtn.className = "rounded-full p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 transition";
    delBtn.innerHTML = '<i class="ri-delete-bin-line"></i>';
    delBtn.addEventListener("click", () => confirmDelete(folder.id));
    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    row.appendChild(iconWrap);
    row.appendChild(nameEl);
    row.appendChild(actions);
    wrapper.appendChild(row);

    const childrenDiv = document.createElement("div");
    childrenDiv.className = "ml-5 border-l border-slate-200 pl-4 space-y-2";

    folder.childrens.forEach(child => {
        childrenDiv.appendChild(renderFolder(child));
    });

    if (folder.childrens.length) wrapper.appendChild(childrenDiv);
    return wrapper;
}

function renderFolders() {
    if (!container) return;

    container.innerHTML = "";

    if (!folderData.childrens || folderData.childrens.length === 0) {
        const empty = document.createElement("div");
        empty.className =
            "rounded-lg border border-dashed border-slate-200 bg-white/60 p-10 text-center text-sm text-slate-500";
        empty.innerHTML = '<div class="mb-2 text-3xl text-slate-300"><i class="ri-folder-add-line"></i></div><div>No folders yet</div>';
        container.appendChild(empty);
        return;
    }

    folderData.childrens.forEach((child) => {
        container.appendChild(renderFolder(child));     
    });
}

function confirmDelete(id) {
    pendingDeleteId = id;
    popupContainer.classList.remove("hidden", "opacity-0", "pointer-events-none");
    popupContainer.classList.add("flex");
    popup.classList.add("hidden");
    if (deleteContainer) deleteContainer.classList.remove("hidden");
}

function removeFromTree(root, id) {
    const idx = root.childrens.findIndex((c) => c.id === id);
    if (idx !== -1) {
        root.childrens.splice(idx, 1);
        return true;
    }
    for (const child of root.childrens) {
        if (removeFromTree(child, id)) return true;
    }
    return false;   
}

window.showFolderNameField = showFolderNameField;
window.popupRemove = popupRemove;
window.confirmDelete = confirmDelete;
window.editFolderName = editFolderName;
