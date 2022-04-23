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

let previous_landmarks = null;

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
  }).then((data) => {
    letter_list.push(data.text);
    output_text.innerHTML = letter_list.join();
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

    for (const landmarks of results.multiHandLandmarks) {
      drawConnectors(canvas1Ctx, landmarks, HAND_CONNECTIONS, {
        color: "#00FF00",
        lineWidth: 5,
      });
      drawLandmarks(canvas1Ctx, landmarks, {
        color: "#FF0000",
        lineWidth: 2,
      });
    }
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
  console.log(e.code);
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
  }
}

document.addEventListener("keydown", logKey);
