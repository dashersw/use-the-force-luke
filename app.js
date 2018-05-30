const Mousetrap = require('mousetrap');
const VideoPlayer = require('./video-player');
const video = document.getElementById('video');

const videoPlayer = new VideoPlayer(video, './force.m4a');
window.v = videoPlayer;
const mind = require('./eeg');

const steps = {
  INITIAL: 0,
  INTRO: 1,
  FORCE: 2,
  OUTRO: 3
};

let interval;
let miniInterval;

const states = {
  [steps.INITIAL]() {
    reset();
  },
  [steps.INTRO]() {
    video.currentTime = 0;
    videoPlayer.playForward();
    interval = setInterval(() => {
      if (video.currentTime > 42) {
        videoPlayer.pause();
        clearInterval(interval);
        clearInterval(miniInterval);
      }
    }, 100);

  },
  [steps.FORCE]() {
    clearInterval(interval);
    clearInterval(miniInterval);

    video.currentTime = 42;

    miniInterval = setInterval(() => {
      if (video.currentTime < 42) video.currentTime = 42;
    }, 100);

    interval = setInterval(() => {
      const force = mind.getForce();
      if (force == 1) {
        if (videoPlayer.direction == videoPlayer.reverse)
          videoPlayer.playForward();
      }
      else if (force == -1) {
        if (videoPlayer.direction == videoPlayer.forward)
          videoPlayer.playReverse();
      }

      if (video.currentTime > 57) {
        clearInterval(interval);
        clearInterval(miniInterval);
        return advance();
      }
    }, 500);

    videoPlayer.playForward();
  },
  [steps.OUTRO]() {
    clearInterval(interval);
    clearInterval(miniInterval);

    videoPlayer.playForward();
  }
}

let step = steps.INITIAL;

Mousetrap.bind('space', advance);
Mousetrap.bind('r', reset);

function reset() {
  clearInterval(interval);
  clearInterval(miniInterval);

  video.currentTime = 0;

  videoPlayer.pause();
  video.currentTime = 0;
  step = steps.INITIAL;
}

function advance(e) {
  if (e && e.preventDefault) e.preventDefault();

  switch (step) {
    case steps.INITIAL:
      step = steps.INTRO; break;
    case steps.INTRO:
      step = steps.FORCE; break;
    case steps.FORCE:
      step = steps.OUTRO; break;
    case steps.OUTRO:
      step = steps.INITIAL; break;
  }

  states[step]();
}
