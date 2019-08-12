const contentElement = document.getElementById('content');
const buttonElement = document.getElementById('format');

const format = () => {
  const content = contentElement.value;

  if (!content || content === '') {
    return ;
  }

  try {
    const obj = JSON.parse(content);
    const result = JSON.stringify(obj, null, 4);
    contentElement.value = result;
  } catch (err) {
    alert('Invalid json string');
  }
}

buttonElement.addEventListener('click', format);
