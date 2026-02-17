/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// setupEnv must load before App because lexical computes CAN_USE_BEFORE_INPUT
// at import time (disableBeforeInput is used to test legacy events)
// eslint-disable-next-line simple-import-sort/imports
import './index.css';

import * as React from 'react';

import App from './App';

export default function Notes() {
    return (
    <React.StrictMode>
        <App />
    </React.StrictMode>
        );
}
