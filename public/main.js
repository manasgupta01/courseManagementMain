// main.js
document.getElementById('uploadForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData();
  formData.append('image', document.getElementById('imageInput').files[0]);

  try {
    const response = await fetch('/upload', {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    displayImage(data.imageUrl);
  } catch (error) {
    console.error('Error uploading image:', error);
  }
});

function displayImage(imageUrl) {
  const img = document.createElement('img');
  img.src = imageUrl;
  document.getElementById('imageContainer').appendChild(img);
}
