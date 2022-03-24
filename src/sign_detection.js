const videoElement = document.getElementsByClassName("input_video")[0];

const canvas1 = document.getElementsByClassName("output_canvas")[0];
const canvas1Ctx = canvas1.getContext("2d");

const canvas2 = document.getElementsByClassName("output_canvas")[1];
const canvas2Ctx = canvas2.getContext("2d");

const collected_text = document.getElementById("collected");
const stopped_text = document.getElementById("stopped");
const output_text = document.getElementById("signs");

const NUMNER_OF_CORRECT_FRAMES = 20;
const NUMBER_OF_WAITING_FRAMES = 20;
const URL = "http://localhost:8001/test";

let correct_counter = 0;
let false_counter = 0;

let frame_list = [];
let sign_list = [];

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

function get_changes(current, prev) {
  if (prev === null || prev.length != 2 || current.length != 2) {
    return false;
  }

  let diff = 0;
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 21; j++) {
      const f_obj = current[i][j];
      const s_obj = prev[i][j];
      diff += Math.abs(f_obj.x - s_obj.x);
      diff += Math.abs(f_obj.y - s_obj.y);
    }
  }
  if (diff >= 0.7) {
    return true;
  }
  return false;
}

function send() {
  postData(URL, { data: frame_list }).then((data) => {
    sign_list.push(data.text);
    output_text.innerHTML = sign_list.join();
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
    const cmp = get_changes(results.multiHandLandmarks, previous_landmarks);
    previous_landmarks = results.multiHandLandmarks;
    if (cmp) {
      correct_counter++;
      frame_list.push(canvas2.toDataURL());
      false_counter = 0;
    } else {
      false_counter++;
      if (
        false_counter == NUMBER_OF_WAITING_FRAMES &&
        correct_counter >= NUMNER_OF_CORRECT_FRAMES
      ) {
        send();
        false_counter = 0;
        correct_counter = 0;
      }
      if (false_counter == NUMBER_OF_WAITING_FRAMES) {
        false_counter = 0;
        correct_counter = 0;
        frame_list = [];
      }
    }

    collected_text.innerHTML = `${correct_counter} collected`;
    stopped_text.innerHTML = `${false_counter} Stopped`;

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
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
  },
});
hands.setOptions({
  maxNumHands: 2,
  modelComplexity: 1,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
});
hands.onResults(onResults);

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({ image: videoElement });
    // console.log(videoElement.);
  },
  width: 1080,
  height: 720,
});
camera.start();
