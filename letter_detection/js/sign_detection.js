const videoElement = document.getElementsByClassName("input_video")[0];

const canvas1 = document.getElementsByClassName("output_canvas")[0];
const canvas1Ctx = canvas1.getContext("2d");

const canvas2 = document.getElementsByClassName("output_canvas")[1];
const canvas2Ctx = canvas2.getContext("2d");

const collected_text = document.getElementById("collected");
const stopped_text = document.getElementById("stopped");
const output_text = document.getElementById("signs");

const NUMNER_OF_CORRECT_FRAMES = 25;
const URL = "http://localhost:8002/test";

let can_detect = true;

let identical_counter = 0;

let frame_list = [];
let letter_list = [];
let word_list = [];

let previous_landmarks = null;

const reRender = () => {
  output_text.innerHTML = word_list.join(" ") + " " + letter_list.join("");
};

async function get_voice(text) {
  const request = `https://texttospeech.responsivevoice.org/v1/text:synthesize?text=${text}&lang=ar&engine=g1&name=&pitch=0.5&rate=0.5&volume=1&key=0POmS5Y2&gender=female`;
  let audio = new Audio(request);
  audio.play();
}

async function postData(url = "", data = {}) {
  // Default options are marked with *
  const response = await fetch(url, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  return response.json();
}
// http://127.0.0.1:5500/sign_detection/index.html
function get_changes(current, prev) {
  if (prev === null || prev.length == 0 || current.length == 0) {
    return true;
  }
  let diff = 0;
  for (let j = 0; j < 21; j++) {
    const f_obj = current[0][j];
    const s_obj = prev[0][j];
    diff += Math.abs(f_obj.y - s_obj.y);
  }

  if (diff <= 0.2) {
    return false;
  }
  return true;
}

function send(hand_label) {
  postData(URL, {
    data: [
      frame_list[0],
      frame_list[5],
      frame_list[10],
      frame_list[15],
      frame_list[20],
    ],
    hand_label: hand_label === "Left" ? "Right" : "Left",
  }).then((data) => {
    letter_list.push(data.text);
    reRender();
  });
  frame_list = [];
}

function onResults(results) {
  canvas1Ctx.save();
  canvas1Ctx.clearRect(0, 0, canvas1.width, canvas1.height);
  canvas1Ctx.drawImage(results.image, 0, 0, canvas1.width, canvas1.height);

  canvas2Ctx.save();
  canvas2Ctx.clearRect(0, 0, canvas2.width, canvas2.height);
  canvas2Ctx.drawImage(results.image, 0, 0, canvas2.width, canvas2.height);

  if (results.multiHandLandmarks) {
    let hand_label = results?.multiHandedness[0]?.label;
    const cmp = get_changes(results.multiHandLandmarks, previous_landmarks);
    previous_landmarks = results.multiHandLandmarks;
    if (cmp) {
      identical_counter = 0;
      frame_list = [];
    } else {
      identical_counter++;
      frame_list.push(canvas2.toDataURL());
      if (identical_counter === NUMNER_OF_CORRECT_FRAMES) {
        send(hand_label);
      }
    }

    collected_text.innerHTML = `${identical_counter} collected`;

    let min_x = 10;
    let min_y = 10;
    let max_x = 0;
    let max_y = 0;
    for (const landmarks of results.multiHandLandmarks) {
      for (const point of landmarks) {
        min_x = Math.min(point.x, min_x);
        min_y = Math.min(point.y, min_y);
        max_x = Math.max(point.x, max_x);
        max_y = Math.max(point.y, max_y);
      }
      // drawConnectors(canvas1Ctx, landmarks, HAND_CONNECTIONS, {
      //   color: "#00FF00",
      //   lineWidth: 5,
      // });
      // drawLandmarks(canvas1Ctx, landmarks, {
      //   color: "#FF0000",
      //   lineWidth: 2,
      // });
    }

    min_x *= 960;
    max_x *= 960;
    min_y *= 720;
    max_y *= 720;
    const shift = 40;

    canvas1Ctx.beginPath();
    canvas1Ctx.lineWidth = "5";
    canvas1Ctx.strokeStyle = "green";
    canvas1Ctx.rect(
      min_x - shift,
      min_y - shift,
      max_x - min_x + shift,
      max_y - min_y + shift
    );
    canvas1Ctx.stroke();
  }
  canvas1Ctx.restore();
}

const hands = new Hands({
  locateFile: (file) => {
    console.log(file);
    return `../lib/${file}`;
    // return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
  },
});
hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
});
hands.onResults(onResults);

const camera = new Camera(videoElement, {
  onFrame: async () => {
    if (can_detect) {
      await hands.send({ image: videoElement });
    }

    // console.log(videoElement.);
  },
  width: 960,
  height: 720,
});
camera.start();

function logKey(e) {
  if (e.code === "Enter") {
    can_detect = true;
  } else if (e.code === "Escape") {
    can_detect = false;
    identical_counter = 0;

    frame_list = [];
    collected_text.innerHTML = `${identical_counter} collected`;

    canvas1Ctx.fillStyle = "black";
    canvas1Ctx.fillRect(0, 0, canvas.width, canvas.height);
    canvas2Ctx.fillStyle = "black";
    canvas2Ctx.fillRect(0, 0, canvas.width, canvas.height);

    // canvas1Ctx.clearRect(0, 0, canvas1.width, canvas1.height);
    // canvas2Ctx.clearRect(0, 0, canvas1.width, canvas1.height);
  } else if (e.code === "Space") {
    const new_word = letter_list.join("");
    letter_list = [];
    get_voice(new_word);
    word_list.push(new_word);
    reRender();
  } else if (e.code === "Delete") {
    letter_list.pop();
    reRender();
  }
}

document.addEventListener("keydown", logKey);

// https://responsivevoice.org/text-to-speech-languages/%D8%A7%D9%84%D9%86%D8%B5-%D8%A5%D9%84%D9%89-%D8%AE%D8%B7%D8%A7%D8%A8-%D8%A8%D8%A7%D9%84%D9%84%D8%BA%D8%A9-%D8%A7%D9%84%D8%B9%D8%B1%D8%A8%D9%8A%D8%A9/
