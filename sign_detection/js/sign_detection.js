const videoElement = document.getElementsByClassName("input_video")[0];

const canvas1 = document.getElementsByClassName("output_canvas")[0];
const canvas1Ctx = canvas1.getContext("2d");

const canvas2 = document.getElementsByClassName("output_canvas")[1];
const canvas2Ctx = canvas2.getContext("2d");

const collected_text = document.getElementById("collected");
const stopped_text = document.getElementById("stopped");
const output_text = document.getElementById("signs");

const NUMNER_OF_CORRECT_FRAMES = 15;
const NUMBER_OF_WAITING_FRAMES = 30;
const URL = "http://localhost:8001/test";

const actions = {
  one: "واحد",
  you: "انت",
  teacher: "معلم",
  girl: "فتاة",
  tomorrow: "غدا",
  mom: "ام",
  look: "انظر",
  crazy: "مجنون",
  walk: "يمشى",
  agree: "موافق",
};

let can_detect = true;

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
// http://127.0.0.1:5500/sign_detection/index.html
function get_changes(current, prev) {
  if (prev === null || prev.length == 0 || current.length == 0) {
    return false;
  }
  let counter = Math.min(prev.length, current.length);

  let diffs = [0, 0];
  for (let i = 0; i < counter; i++) {
    for (let j = 0; j < 21; j++) {
      const f_obj = current[i][j];
      const s_obj = prev[i][j];
      diffs[i] += Math.abs(f_obj.x - s_obj.x);
      diffs[i] += Math.abs(f_obj.y - s_obj.y);
    }
  }
  if (diffs[0] >= 0.3 || diffs[1] >= 0.3) {
    return true;
  }
  return false;
}

function send() {
  postData(URL, { data: frame_list }).then((data) => {
    sign_list.push(actions[data.text]);
    output_text.innerHTML = sign_list.join();
    let audio = new Audio(`voices/${data.text}.mp3`);
    audio.play();
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
    console.log(file);
    return `../lib/${file}`;
    // return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
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
    if (can_detect) {
      await hands.send({ image: videoElement });
    }

    // console.log(videoElement.);
  },
  width: 1080,
  height: 720,
});
camera.start();

function logKey(e) {
  console.log(e.code);
  if (e.code === "Enter") {
    can_detect = true;
  } else if (e.code === "Escape") {
    can_detect = false;
    correct_counter = 0;
    false_counter = 0;
    frame_list = [];
    collected_text.innerHTML = `${correct_counter} collected`;
    stopped_text.innerHTML = `${false_counter} Stopped`;

    canvas1Ctx.fillStyle = "black";
    canvas1Ctx.fillRect(0, 0, canvas.width, canvas.height);
    canvas2Ctx.fillStyle = "black";
    canvas2Ctx.fillRect(0, 0, canvas.width, canvas.height);

    // canvas1Ctx.clearRect(0, 0, canvas1.width, canvas1.height);
    // canvas2Ctx.clearRect(0, 0, canvas1.width, canvas1.height);
  }
}

document.addEventListener("keydown", logKey);
