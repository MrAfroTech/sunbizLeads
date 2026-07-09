import React, { useState, useEffect, useRef } from 'react';
import './VideoOptimizer.css';

const VideoOptimizer = () => {
  const [videos, setVideos] = useState([
    { id: '2022396', src: '/2022396-hd_1920_1080_30fps.mp4', segments: [], currentSegment: null },
    { id: '4667118', src: '/4667118-uhd_4096_2160_25fps.mp4', segments: [], currentSegment: null },
    { id: '4667157', src: '/4667157-uhd_4096_2160_25fps.mp4', segments: [], currentSegment: null },
    { id: '4774631', src: '/4774631-hd_1920_1080_25fps (1).mp4', segments: [], currentSegment: null },
    { id: '5816530', src: '/5816530-hd_1920_1080_25fps.mp4', segments: [], currentSegment: null },
    { id: '6396313', src: '/6396313-hd_1920_1080_25fps.mp4', segments: [], currentSegment: null },
    { id: '6396314', src: '/6396314-hd_1920_1080_25fps.mp4', segments: [], currentSegment: null },
    { id: '7219895', src: '/7219895-uhd_3840_2160_24fps.mp4', segments: [], currentSegment: null },
    { id: '7269151', src: '/7269151-uhd_3840_2160_25fps.mp4', segments: [], currentSegment: null },
    { id: '7269643', src: '/7269643-uhd_3840_2160_25fps.mp4', segments: [], currentSegment: null },
    { id: '7722221', src: '/7722221-uhd_3840_2160_25fps.mp4', segments: [], currentSegment: null },
    { id: '9003399', src: '/9003399-hd_1920_1080_25fps.mp4', segments: [], currentSegment: null },
    { id: '14058819', src: '/14058819-uhd_2732_1440_24fps.mp4', segments: [], currentSegment: null }
  ]);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const videoRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [exportedCode, setExportedCode] = useState('');
  const [showExport, setShowExport] = useState(false);

  // Load video metadata
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.addEventListener('loadedmetadata', () => {
        setDuration(video.duration);
      });
      
      video.addEventListener('timeupdate', () => {
        setCurrentTime(video.currentTime);
      });
    }
    
    return () => {
      if (video) {
        video.removeEventListener('loadedmetadata', () => {});
        video.removeEventListener('timeupdate', () => {});
      }
    };
  }, [activeVideoIndex]);

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (e) => {
    const video = videoRef.current;
    const seekTime = (e.nativeEvent.offsetX / e.target.clientWidth) * duration;
    video.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const handleSetMarker = (type) => {
    const currentVideo = videos[activeVideoIndex];
    const updatedVideos = [...videos];
    
    if (type === 'start') {
      if (!currentVideo.currentSegment) {
        updatedVideos[activeVideoIndex].currentSegment = { 
          start: currentTime,
          end: null 
        };
      } else {
        updatedVideos[activeVideoIndex].currentSegment.start = currentTime;
      }
    } else if (type === 'end') {
      if (currentVideo.currentSegment && currentVideo.currentSegment.start !== null) {
        updatedVideos[activeVideoIndex].currentSegment.end = currentTime;
        
        // Add segment to the list if valid
        if (currentVideo.currentSegment.start < currentVideo.currentSegment.end) {
          updatedVideos[activeVideoIndex].segments.push({
            start: currentVideo.currentSegment.start,
            end: currentVideo.currentSegment.end
          });
          updatedVideos[activeVideoIndex].currentSegment = null;
        }
      }
    }
    
    setVideos(updatedVideos);
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const milliseconds = Math.floor((time % 1) * 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  };

  const handleDeleteSegment = (videoIndex, segmentIndex) => {
    const updatedVideos = [...videos];
    updatedVideos[videoIndex].segments.splice(segmentIndex, 1);
    setVideos(updatedVideos);
  };

  const handleVideoSelect = (index) => {
    setActiveVideoIndex(index);
    setIsPlaying(false);
  };

  const generateFFmpegCommands = () => {
    let commands = [];
    
    videos.forEach(video => {
      video.segments.forEach((segment, index) => {
        const duration = segment.end - segment.start;
        const command = `ffmpeg -i ${video.src} -ss ${segment.start.toFixed(3)} -t ${duration.toFixed(3)} -c:v libx264 -c:a aac -strict experimental -b:a 192k ${video.id}_segment${index+1}.mp4`;
        commands.push(command);
      });
    });
    
    return commands.join('\n\n');
  };

  const generateVideoListCode = () => {
    let segmentPaths = [];
    
    videos.forEach(video => {
      video.segments.forEach((segment, index) => {
        segmentPaths.push(`'/${video.id}_segment${index+1}.mp4'`);
      });
    });
    
    return `const videoSources = [\n  ${segmentPaths.join(',\n  ')}\n];`;
  };

  const handleExport = () => {
    const videoCode = generateVideoListCode();
    const ffmpegCommands = generateFFmpegCommands();
    const exportText = `// Video sources array for React component\n${videoCode}\n\n// FFmpeg commands to create segments\n/*\n${ffmpegCommands}\n*/`;
    setExportedCode(exportText);
    setShowExport(true);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(exportedCode)
      .then(() => {
        alert('Copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
      });
  };

  return (
    <div className="video-optimizer">
      <h1>EzDrink Video Segment Extractor</h1>
      
      <div className="optimizer-container">
        <div className="video-selector">
          <h3>Available Videos</h3>
          <div className="video-list">
            {videos.map((video, index) => (
              <div 
                key={video.id} 
                className={`video-item ${index === activeVideoIndex ? 'active' : ''}`}
                onClick={() => handleVideoSelect(index)}
              >
                <span>{video.id}</span>
                <span className="segment-count">{video.segments.length} segments</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="video-editor">
          <div className="video-container">
            <video 
              ref={videoRef}
              src={videos[activeVideoIndex].src} 
              controls={false}
              onClick={handlePlayPause}
            ></video>
            <div className="video-controls">
              <button onClick={handlePlayPause}>
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              <div className="seek-bar" onClick={handleSeek}>
                <div className="seek-progress" style={{ width: `${(currentTime / duration) * 100}%` }}></div>
                
                {/* Render segment markers */}
                {videos[activeVideoIndex].segments.map((segment, segmentIndex) => (
                  <div 
                    key={segmentIndex}
                    className="segment-marker"
                    style={{
                      left: `${(segment.start / duration) * 100}%`,
                      width: `${((segment.end - segment.start) / duration) * 100}%`
                    }}
                  ></div>
                ))}
                
                {/* Render current segment in progress */}
                {videos[activeVideoIndex].currentSegment && videos[activeVideoIndex].currentSegment.start !== null && (
                  <div 
                    className="current-segment-marker"
                    style={{
                      left: `${(videos[activeVideoIndex].currentSegment.start / duration) * 100}%`,
                      width: videos[activeVideoIndex].currentSegment.end 
                        ? `${((videos[activeVideoIndex].currentSegment.end - videos[activeVideoIndex].currentSegment.start) / duration) * 100}%`
                        : `${((currentTime - videos[activeVideoIndex].currentSegment.start) / duration) * 100}%`
                    }}
                  ></div>
                )}
              </div>
              <div className="time-display">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>
            
            <div className="marker-controls">
              <button onClick={() => handleSetMarker('start')}>Set Segment Start</button>
              <button onClick={() => handleSetMarker('end')}>Set Segment End</button>
            </div>
          </div>
          
          <div className="segments-container">
            <h3>Segments ({videos[activeVideoIndex].segments.length})</h3>
            {videos[activeVideoIndex].segments.length > 0 ? (
              <div className="segments-list">
                {videos[activeVideoIndex].segments.map((segment, segmentIndex) => (
                  <div key={segmentIndex} className="segment-item">
                    <span>Start: {formatTime(segment.start)}</span>
                    <span>End: {formatTime(segment.end)}</span>
                    <span>Duration: {formatTime(segment.end - segment.start)}</span>
                    <button onClick={() => handleDeleteSegment(activeVideoIndex, segmentIndex)}>Delete</button>
                  </div>
                ))}
              </div>
            ) : (
              <p>No segments defined yet. Use the controls to define 1-2 second segments.</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="export-section">
        <button className="export-button" onClick={handleExport}>
          Generate Export Code
        </button>
        
        {showExport && (
          <div className="export-result">
            <h3>Export Code <button onClick={copyToClipboard}>Copy</button></h3>
            <textarea value={exportedCode} readOnly rows={10}></textarea>
            <div className="instructions">
              <h4>Next Steps:</h4>
              <ol>
                <li>Copy and run these FFmpeg commands in your terminal to create the video segments</li>
                <li>Update your HeroSection.js with the generated videoSources array</li>
                <li>Place all generated segment files in your public folder</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoOptimizer;