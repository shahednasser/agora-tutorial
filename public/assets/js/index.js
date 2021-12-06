document.addEventListener("DOMContentLoaded", function() {
  const recordingBtn = document.getElementById('recordingBtn')
  const audioData = {
    track: null,
    channels: []
  }
    
  recordingBtn.addEventListener('click', function () {
    if (!audioData.track) {
      //start recording
      AgoraRTC.createMicrophoneAudioTrack().then((track) => {
        audioData.track = track
        recordingBtn.innerText = 'Stop'
        audioData.track.setAudioFrameCallback((buffer) => {
          for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
            // Float32Array with PCM data
            const currentChannelData = buffer.getChannelData(channel);
            console.log("PCM data in channel", channel, currentChannelData);
            audioData.channels.push(currentChannelData)
          }
        })
      })
    } else {
      //stop recording
      audioData.track.setAudioFrameCallback(null)
      audioData.track.close()
      audioData.track = null
      recordingBtn.innerText = 'Start Recording'
    }
  })
})