/**
 * JWT decoder
 * @author Chen Su <ghosind@gmail.com>
 * @version 0.0.1
 */

 /**
  * decode jwt
  * @param {String} token jwt
  */
const decoder = (token) => {
  if (!token || typeof token !== 'string') {
    throw new Error('token must be a string');
  }

  const parts = token.split('.');

  if (parts.length !== 3) {
    throw new Error('invalid token');
  }

  const header = JSON.parse(atob(parts[0]));
  const payload = JSON.parse(atob(parts[1]));

  return {
    header,
    payload,
    // signature: '[Signature]',
  }
}

/**
 * decode button handler
 */
const clickHandler = () => {
  const headerElement = document.getElementById('token-header');
  const payloadElement = document.getElementById('token-payload');
  const errorMessageElement = document.getElementById('error-message');

  headerElement.innerText = '';
  payloadElement.innerText = '';
  errorMessageElement.innerText = '';

  try {
    const token = document.getElementById('token').value;
    const payloads = decoder(token);
    headerElement.innerText = `Header: ${JSON.stringify(payloads.header, null, 4)}`;
    payloadElement.innerText = `Payload: ${JSON.stringify(payloads.payload, null, 4)}`;
  } catch (err) {
    errorMessageElement.innerText = `ERROR: ${err.message}`;
  } 
}

// add button click event listener
const decodeButton = document.getElementById('decode');
decodeButton.addEventListener('click', clickHandler);
