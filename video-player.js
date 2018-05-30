const now = Date.now();
const context = new AudioContext();
module.exports = class VideoPlayer {
  constructor(video, audio) {
    this.loadAudio(audio);

    this.video = video;
    this.requestId;
    this.reverse;
    this.forward;
    this.audio;

    this.direction = this.forward;

    video.muted = true;

    this.state = VIDEO_PLAYER_STATE.INITIAL;
  }

  playForward() {
    if (this.state == VIDEO_PLAYER_STATE.PLAYING && this.direction == this.forward)
      return this.playAudio(this.direction, video.currentTime);

    this.state = VIDEO_PLAYER_STATE.PLAYING;

    cancelAnimationFrame(this.requestId);

    this.video.pause();
    this.direction = this.forward;
    this.playAudio(this.direction, video.currentTime);

    this.video.play();
  }

  playReverse() {
    if (this.state == VIDEO_PLAYER_STATE.PLAYING && this.direction == this.reverse)
      return this.playAudio(this.direction, video.duration - video.currentTime);

    this.state = VIDEO_PLAYER_STATE.PLAYING;

    this.direction = this.reverse;
    this.playAudio(this.direction, video.duration - video.currentTime);
    this.video.play();
    this.rewind(1);
  }

  pause() {
    this.state = VIDEO_PLAYER_STATE.PAUSED;

    cancelAnimationFrame(this.requestId);

    this.video.pause();
    this.stopAudio();
  }

  rewind(rewindSpeed) {
    cancelAnimationFrame(this.requestId);
    const startSystemTime = Date.now();
    let startVideoTime = this.video.currentTime;
    let counter = 0;

    const work = (timestamp) => {
      if (++counter % 2 > 0) return this.requestId = requestAnimationFrame(work);

      this.video.playbackRate = 1;
      if (this.video.currentTime == 0) {
        cancelAnimationFrame(this.requestId);
        this.pause();
      } else {
        const elapsed = now + timestamp - startSystemTime;
        this.video.currentTime = Math.max(startVideoTime - elapsed * rewindSpeed / 1000.0, 0);
        this.requestId = requestAnimationFrame(work);
      }
    }

    this.requestId = requestAnimationFrame(work);
  }

  loadAudio(url) {
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';

    request.onload = () => {
      context.decodeAudioData(request.response, buffer => {
        this.forward = buffer;

        this.reverse = new AudioBuffer({ numberOfChannels: buffer.numberOfChannels, length: buffer.length, sampleRate: buffer.sampleRate });
        this.reverse.getChannelData(0).set(buffer.getChannelData(0));
        this.reverse.getChannelData(1).set(buffer.getChannelData(1));
        this.reverse.getChannelData(0).reverse();
        this.reverse.getChannelData(1).reverse();
      }, console.log);
    }
    request.send();
  }

  playAudio(buffer, time) {
    this.stopAudio();
    const source = context.createBufferSource();
    source.connect(context.destination);
    source.buffer = buffer;
    source.start(0, time);
    this.audio = source;
  }

  stopAudio() {
    if (this.audio) this.audio.stop();
  }

}

const VIDEO_PLAYER_STATE = {
  INITIAL: 0,
  PLAYING: 1,
  PAUSED: 2,
}
