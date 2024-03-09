import React, { useState, useRef, useEffect } from "react";
import axios from 'axios';
import Navbar from "../components/Navbar";
import Lottie from 'lottie-react';
import animationData from '../components/lot.json';
import { useSelector } from "react-redux";
import classNames from "classnames";
import upload from "../assets/upload.svg";
import mic from "../assets/mic.svg";
import animationData1 from '../components/lot.json';
import animationData2 from '../components/lots2.json';
import confetti from 'canvas-confetti';
import { Link } from "react-router-dom";

const Sentiment = () => {
  const [audioFile, setAudioFile] = useState(null);
  const [predictedEmotion, setPredictedEmotion] = useState(null);
  const [predictedText, setPredictedText] = useState(null);
  const [sentimentAnalysis, setSentimentAnalysis] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const audioRef = useRef(null);
  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
  const token = useSelector(state => state.user.token);
  const [isSelected, setIsSelected] = useState(false);
  const [loading, setLoading] = useState(false);

  const audioChunks = useRef([]);
  const [recordings, setRecordings] = useState([]);
  const mediaRecorderRef = useRef(null);
  const [recordingOrNotRecording, setRecordingOrNotRecording] = useState(false);

  useEffect(() => {
    resetValues();
  }, [isSelected]);

  const resetValues = () => {
    setPredictedEmotion(null);
    setAudioUrl(null);
    setRecordings([]);
    setAudioFile(null);
    setPredictedText(null);
    setSentimentAnalysis(null);
  }

  const startRec = async () => {
    setRecordingOrNotRecording(true);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const options = { mimeType: 'audio/webm' }; // WebM format for wider compatibility
    const mediaRecorder = new MediaRecorder(stream, options);
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunks.current.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
      setAudioFile(audioBlob);
      const audioUrl = URL.createObjectURL(audioBlob);
      setRecordings((prevRecs) => [...prevRecs, audioUrl]);
      audioChunks.current = []; // Reset the chunks
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorderRef.current.start();

    setTimeout(() => {
      stopRec();
    }, 5000);
  };

  const stopRec = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setRecordingOrNotRecording(false);
    }
  };

  const handlePredict1 = async () => {
    setLoading(true);
    const formData = new FormData();
    formData.append('file', audioFile, 'recording.wav');

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/predict/prediction-emotion-sentiment/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token.access}`,
        },
      });

      if (response.data.error) {
        alert(`Error: ${response.data.error}`);
      } else {
        setPredictedEmotion(response.data.prediction_result);
        setPredictedText(response.data.txt);
        setSentimentAnalysis(response.data.sentiment);

        confetti({
          particleCount: 100,
          angle: 60,
          spread: 360,
          startVelocity: 30,
          decay: 0.9,
          colors: ['#f44336', '#e91e63', '#9c27b0', '#3f51b5', '#03a9f4'],
        });
      }
    } catch (error) {
      console.error('Error making prediction:', error);
    } finally {
      setLoading(false);
    }
  };

  const audioFileInputRef = useRef(null);

  const handleUpload = (event) => {
    const file = event.target.files[0];
    setAudioFile(file);
    setAudioUrl(URL.createObjectURL(file));  // Create a URL for the uploaded file
    // Reset predicted emotion when a new file is uploaded
    setPredictedEmotion(null);
  };

  const handleUploadButton = () => {
    audioFileInputRef.current.click();
  };
  const isNeutral = (sentimentAnalysis) => {
    return Object.values(sentimentAnalysis).every(value => value === 0);
  }

  return (
    <>
      <Navbar />
      <div className="w-full h-full flex flex-col items-center justify-center mt-8  text-white">
        <h1 className="text-4xl text-center mb-16 animate-pulse">
          <span className="text-3xl font-semibold">Discover Your True Emotions,</span> <br />
          <span className="text-3xl font-semibold">Using Sentiment Analysis</span>
        </h1>

        {/* Loading bar */}
        {loading && (
          <div className="w-24 h-24 rounded-full border-8 border-white border-t-8 border-t-rose-500 animate-spin"></div>
        )}

        {/* Upload Button (Centered) */}
        {isSelected && (
          <label className="relative overflow-hidden">
            <input
              type="file"
              className="hidden"
              onChange={handleUpload}
              accept="audio/*"
              ref={audioFileInputRef}
            />
            <Lottie
              animationData={animationData}
              className="lottie-animation-home cursor-pointer animate-bounce"
              onClick={handleUploadButton}
            />
          </label>
        )}

        {/* Audio Player */}
        {audioUrl && isSelected && (
          <div className="mt-4">
            <audio ref={audioRef} controls>
              <source src={audioUrl} type="audio/wav" />
              Your browser does not support the audio element.
            </audio>
            <div className="flex justify-center mt-2">
              <a href={audioUrl} download={`recordings.wav`} className="underline hover:text-rose-300">
                Download
              </a>
            </div>
          </div>
        )}

        {/* Predict Button (Visible only after uploading) */}
        {audioFile && isSelected && (
          <div
            className="bg-white text-rose-500 hover:bg-rose-300 hover:text-white px-6 py-3 mt-4 rounded-full cursor-pointer transition-all duration-300 animate-pulse"
            onClick={handlePredict1}
          >
            Predict
          </div>
        )}

        {/* Display Predicted Emotion and Sentiment Analysis */}
        {(predictedEmotion || predictedText || sentimentAnalysis) && isSelected && (
          <div className="mt-8 text-2xl font-normal animate-bounce">
            {predictedEmotion && (
              <div>
                Decode the Feels: Emotion Unveiled - {predictedEmotion}
              </div>
            )}
            {predictedText && (
              <div className="mt-4">
                <span className="text-3xl font-semibold">{predictedText}</span>
              </div>
            )}
            {sentimentAnalysis && (
              <div className="mt-4">
                <h2 className="text-2xl font-bold">Sentiment Analysis:</h2>
                {isNeutral(sentimentAnalysis) ? (
                  <div className="text-center mt-4">Neutral</div>
                ) : (
                  <div className="grid grid-cols-3 gap-4 mt-2">
                    {Object.entries(sentimentAnalysis).map(([sentiment, value]) => (
                      <div key={sentiment} className="bg-white text-rose-500 rounded-lg p-4">
                        <p className="font-bold">{sentiment}</p>
                        <p>{value}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Recording part */}
        {!recordingOrNotRecording && !isSelected && (
          <Lottie
            animationData={animationData1}
            className="lottie-animation-home cursor-pointer animate-pulse"
            onClick={startRec}
          />
        )}

        {recordingOrNotRecording && !isSelected && (
          <Lottie
            animationData={animationData2}
            className="lottie-animation-home cursor-pointer animate-spin"
             
          />
        )}

        {!isSelected && recordings.length > 0 && (
          <div className="mt-4">
            <audio controls src={recordings[recordings.length - 1]} />
            <div className="flex justify-center mt-2">
              <a href={recordings[recordings.length - 1]} className="underline hover:text-rose-300" download={`recordings.wav`}>
                Download
              </a>
            </div>
          </div>
        )}

        {!isSelected && audioFile && (
          <button onClick={handlePredict1} className="bg-white text-rose-500 hover:bg-rose-300 hover:text-white px-6 py-3 mt-4 rounded-full cursor-pointer transition-all duration-300 animate-pulse">
            Predict
          </button>
        )}

        {!isSelected && (predictedEmotion || predictedText || sentimentAnalysis) && (
          <div className="mt-8 text-2xl font-normal justify-center">
            {predictedEmotion && (
              <div>
                Decode the Feels: Emotion Unveiled - {predictedEmotion}
              </div>
            )}
            {predictedText && (
              <div className="mt-4">
                <span className="text-3xl font-semibold text-center">{predictedText}</span>
              </div>
            )}
            {sentimentAnalysis && (
              <div className="mt-4 justify-center">
                <h2 className="text-2xl font-bold text-center">Sentiment:</h2>
                {isNeutral(sentimentAnalysis) ? (
                  <div className="text-center mt-4">Neutral</div>
                ) : (
                  <div className="grid grid-cols-3 gap-4 mt-2 content-center">
                    {Object.entries(sentimentAnalysis).map(([sentiment, value]) => (
                      <div key={sentiment} className="bg-white text-rose-500 rounded-lg p-4">
                        <p className="font-bold">{sentiment}</p>
                        <p>{value}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div
          onClick={() => setIsSelected(!isSelected)}
          className={classNames("flex w-20 h-10 bg-white m-10 rounded-full cursor-pointer transition-all duration-300", {
            'bg-rose-500': isSelected,
          })}
        >
          <span
            className={classNames('h-10 w-10 bg-rose-500 rounded-full flex items-center justify-center transition-all duration-300', {
              'ml-10': isSelected,
            })}
          >
            {isSelected && <img src={upload} className="p-1 animate-spin" />}
            {!isSelected && <img src={mic} className="animate-pulse" />}
          </span>
        </div>
        {/* Added text */}
        <div className="flex items-center mt-4">
          <span className="text-white mr-2">Or you want</span>
          <Link to="/home" className="text-rose-500 hover:text-rose-300 transition-colors duration-300">
            audio emotion recognition
          </Link>
        </div>
      </div>
    </>
  );
};

export default Sentiment;
     