const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const formEl = document.getElementById("pollutionReportForm");
const locationEl = document.getElementById("reportLocation");
const typeEl = document.getElementById("pollutionType");
const descriptionEl = document.getElementById("reportDescription");
const imageEl = document.getElementById("reportImage");
const imagePreviewEl = document.getElementById("imagePreview");
const errorEl = document.getElementById("reportError");
const successEl = document.getElementById("reportSuccess");

let selectedImageDataUrl = "";

function showError(message) {
  if (!message) {
    errorEl.style.display = "none";
    errorEl.textContent = "";
    return;
  }
  errorEl.style.display = "block";
  errorEl.textContent = message;
}

function showSuccess(message) {
  if (!message) {
    successEl.style.display = "none";
    successEl.textContent = "";
    return;
  }
  successEl.style.display = "block";
  successEl.textContent = message;
}

function readImageAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("Unable to read selected image."));
    reader.readAsDataURL(file);
  });
}

function clearImagePreview() {
  selectedImageDataUrl = "";
  imagePreviewEl.src = "";
  imagePreviewEl.style.display = "none";
}

imageEl.addEventListener("change", async () => {
  showError("");
  showSuccess("");
  clearImagePreview();

  const file = imageEl.files && imageEl.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    imageEl.value = "";
    showError("Please upload a valid image file.");
    return;
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    imageEl.value = "";
    showError("Image must be 5 MB or smaller.");
    return;
  }

  try {
    selectedImageDataUrl = await readImageAsDataUrl(file);
    imagePreviewEl.src = selectedImageDataUrl;
    imagePreviewEl.style.display = "block";
  } catch (err) {
    imageEl.value = "";
    clearImagePreview();
    showError(err?.message || "Unable to process selected image.");
  }
});

formEl.addEventListener("submit", async (event) => {
  event.preventDefault();
  showError("");
  showSuccess("");

  const location = locationEl.value.trim();
  const pollutionType = typeEl.value.trim();
  const description = descriptionEl.value.trim();

  if (!location || !pollutionType || !description) {
    showError("Please fill in location, pollution type, and description.");
    return;
  }

  const submitButton = formEl.querySelector("button[type='submit']");
  submitButton.disabled = true;
  submitButton.textContent = "Submitting...";

  try {
    await window.PollutionApi.submitReport({
      location,
      pollutionType,
      description,
      imageEvidence: selectedImageDataUrl || null
    });

    formEl.reset();
    clearImagePreview();
    showSuccess("Report submitted and added to the pollution map.");
  } catch (error) {
    showError(error?.message || "Failed to submit report.");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Submit Report";
  }
});
