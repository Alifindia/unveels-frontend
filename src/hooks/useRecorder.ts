import { useReducer, useEffect } from "react";
import { format } from "date-fns";
import { useCamera } from "../context/recorder-context";
import { useReactMediaRecorder } from "react-media-recorder";

// Define action types
const actionTypes = {
  START: "START",
  PAUSE: "PAUSE",
  RESUME: "RESUME",
  STOP: "STOP",
  TICK: "TICK",
} as const;

type ActionTypes = (typeof actionTypes)[keyof typeof actionTypes];

interface Action {
  type: ActionTypes;
  payload?: number;
}

interface State {
  isRecording: boolean;
  isPaused: boolean;
  startTime: number | null;
  elapsedTime: number;
}

// Define initial state
const initialState: State = {
  isRecording: false,
  isPaused: false,
  startTime: null,
  elapsedTime: 0,
};

// Reducer function
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case actionTypes.START:
      return {
        ...state,
        isRecording: true,
        isPaused: false,
        startTime: action.payload ?? null,
        elapsedTime: 0,
      };
    case actionTypes.PAUSE:
      return {
        ...state,
        isPaused: true,
      };
    case actionTypes.RESUME:
      return {
        ...state,
        isPaused: false,
        startTime: (action.payload ?? 0) - state.elapsedTime,
      };
    case actionTypes.STOP:
      return initialState;
    case actionTypes.TICK:
      return {
        ...state,
        elapsedTime: (action.payload ?? 0) - (state.startTime ?? 0),
      };
    default:
      return state;
  }
}

// Custom hook for recording logic
export const useRecordingControls = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const {
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    status,
  } = useCamera();
  // Timer effect for updating elapsed time
  useEffect(() => {
    let interval: number | null = null;

    if (state.isRecording && !state.isPaused) {
      interval = window.setInterval(() => {
        dispatch({ type: actionTypes.TICK, payload: new Date().getTime() });
      }, 1000);
    } else if (!state.isRecording || state.isPaused) {
      if (interval) window.clearInterval(interval);
    }

    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [state.isRecording, state.isPaused]);

  useEffect(() => {
    if (!state.isRecording) {
      if (status === "recording") {
        dispatch({
          type: actionTypes.START,
          payload: new Date().getTime(),
        });
      }
    }
  }, [status]);

  // Start or pause the recording
  const handleStartPause = () => {
    if (!state.isRecording) {
      startRecording();
    } else if (state.isPaused) {
      resumeRecording();
      dispatch({ type: actionTypes.RESUME, payload: new Date().getTime() });
    } else {
      pauseRecording();
      dispatch({ type: actionTypes.PAUSE });
    }
  };

  // Stop the recording
  const handleStop = () => {
    dispatch({ type: actionTypes.STOP });
    stopRecording();
  };

  // Return the state and control functions
  return {
    isRecording: state.isRecording,
    isPaused: state.isPaused,
    elapsedTime: state.elapsedTime,
    formattedTime: format(new Date(state.elapsedTime), "mm:ss"),
    handleStartPause,
    handleStop,
  };
};
