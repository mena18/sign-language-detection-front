const input = document.getElementById("input");
const output_text = document.getElementById("text");

const URL = "http://localhost:8002/text";

async function gettData(url = "", data = "") {
  // Default options are marked with *
  const response = await fetch(`${url}/${data}`);
  return response.json();
}

function send() {
  console.log(input.value);
  gettData(URL, input.value).then((data) => {
    output_text.innerHTML = "";
    const sign_list = data.signs;
    sign_list.forEach((obj) => {
      output_text.innerHTML += `${obj}<br>`;
    });
  });
}

function logKey(e) {
  if (e.code === "Enter") {
    send();
  }
}

document.addEventListener("keydown", logKey);
