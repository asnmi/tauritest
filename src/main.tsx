import React from "react";
import ReactDOM from "react-dom/client";
import Notes from "./texteditor/index";
import { Provider } from 'react-redux';
import { store } from './state_manager/store';

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <Notes />
    </Provider>
  </React.StrictMode>,
);
