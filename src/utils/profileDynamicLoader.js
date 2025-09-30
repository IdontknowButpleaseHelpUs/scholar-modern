// profileDynamicLoader.js

export {
    setProfilePic,
    loadProfilePics
}


/**
 * Safely set profile picture for an element.
 * @param {HTMLElement} imgElement - The <img> element to update.
 * @param {string} path - The profile picture path (from backend JSON).
 */
function setProfilePic(imgElement, path) {
    if (!imgElement) return;

    if (path) {
        imgElement.src = `${path}`; // Use relative path;
        imgElement.onerror = () => {
            imgElement.src = "../assets/user.png";
        };
    } else {
        imgElement.src = "../assets/user.png";
    }
}

/**
 * Load profile picture dynamically for both main and header pfps.
 * @param {string} path - The profile picture path (from backend JSON).
 * @param {HTMLElement} profileImg - The big profile image element.
 * @param {HTMLElement} headerPfp - The header/profile icon image element.
 */
function loadProfilePics(path, profileImg, headerPfp) {
    setProfilePic(profileImg, path);
    setProfilePic(headerPfp, path);
}

