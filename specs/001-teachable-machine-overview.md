# 001 Teachable Machine Overview

## Purpose

This document captures a concise understanding of Teachable Machine as a reference product for this app.

It focuses on:

- technology choices
- UI/UX patterns
- feature set
- product expansion directions for our app

This document separates:

- sourced facts about Teachable Machine
- inferred implications for our app

## What Teachable Machine Is

Teachable Machine is a web-based tool for creating simple machine learning models without writing ML code. Google describes it as a tool that makes creating machine learning models "fast, easy, and accessible for everyone." It supports image, audio, and pose classification, and it allows users to gather examples, train a model, test it, and export it for use in websites, apps, and physical computing projects.[1][2][3]

## Sourced Product Understanding

### Technology

Based on official sources, Teachable Machine is built around these ideas:

- browser-based training and inference
- on-device processing for core training flows
- TensorFlow.js as the core ML runtime in the browser
- export paths for downstream use in websites, apps, and devices
- support for image, audio, and pose inputs[1][2][3][4][5]

Google's older and newer Teachable Machine materials consistently describe local, in-browser training. The original version trained locally in the browser using `deeplearn.js`, while Teachable Machine 2.0 is described as being powered by TensorFlow.js.[2][3][4]

### UI/UX

The core interaction model is simple and iterative:

1. gather examples
2. train
3. test
4. export or reuse

The product emphasizes:

- immediate feedback
- very low setup friction
- live capture from webcam or microphone
- fast iteration after changing examples
- beginner accessibility and no-code onboarding[1][2][3]

The older public project also explicitly recommended desktop use for better support and performance, and described mobile as experimental.[3]

### Features

From the official materials, the core Teachable Machine feature set includes:

- image classification
- sound classification
- pose classification
- live capture from camera or mic
- file upload for examples
- in-browser model training
- instant testing inside the tool
- export for websites, apps, and physical devices
- project saving, including Google Drive in Teachable Machine 2.0[1][2][3][5]

The community repository also shows that exported models are intended to be used through helper libraries and snippets for multiple runtimes and languages, including JavaScript, Java, and Python.[5]

## Inferred Implications For Our App

The points below are inferences from the sources above, not direct quotes from the product team.

### Technology Direction

If our app is "Teachable Machine-like", the most natural technical shape is:

- local-first desktop app
- strong camera, microphone, and file import flows
- lightweight, interactive model training loop
- clear model packaging and export story

Because Teachable Machine leans on browser-side ML and on-device processing, our Tauri app can reasonably aim for:

- WebView-based UI
- local storage for datasets, projects, and model artifacts
- optional in-app ML runtime or external model pipeline
- explicit support for offline-first use cases

### UI/UX Direction

The strongest product pattern to preserve is not the exact visual style. It is the loop:

`collect -> train -> test -> improve`

For our app, this suggests:

- one-screen workflows with minimal navigation depth
- persistent visibility of dataset quality and class balance
- a fast retrain button and short feedback loop
- side-by-side data capture and prediction feedback
- strong empty states and tutorial framing for first-time users

### Feature Direction

A practical v1 feature set for our app would likely include:

- project creation
- class/label management
- image, audio, or motion sample capture
- dataset review and deletion
- one-click training
- live prediction preview
- model export
- project save/load

## Expansion Directions For Our App

These are product opportunities inspired by Teachable Machine, but adapted for a more serious desktop app.

### 1. Better Dataset Management

Teachable Machine is optimized for accessibility and speed. Our app can go further with:

- dataset versioning
- sample tagging
- duplicate detection
- class balance warnings
- confidence and confusion inspection

### 2. Better Evaluation

Teachable Machine emphasizes quick experimentation. Our app can add:

- validation splits
- per-class metrics
- confusion matrix views
- threshold tuning
- model comparison across training runs

### 3. Better Project Persistence

Our app can treat projects as first-class local assets:

- saved projects
- resumable training history
- import/export of project bundles
- model artifact browsing
- local backup and restore

### 4. More Serious Deployment Paths

Teachable Machine exports to multiple environments. For our app, useful expansion paths include:

- export for browser inference
- export for desktop embedding
- export for mobile runtimes
- export of metadata and labels alongside model files

### 5. More Guided Workflows

If the goal is to support non-experts, our app can add:

- capture guidance
- sample count recommendations
- live quality checks
- warnings when classes are visually or acoustically too similar
- suggested next actions after poor model performance

## Product Principles Worth Reusing

These principles appear repeatedly across the Teachable Machine materials:

- reduce setup friction
- keep training interactive
- keep the user in control of their data
- make ML feel exploratory instead of intimidating
- let users export their work into real projects[1][2][3][5]

Those are strong baseline principles for this app.

## Notes For Future Specs

Follow-up specs that would naturally come next:

- product scope and non-goals
- project and dataset data model
- capture workflows
- training pipeline options
- export formats
- evaluation UX

## Sources

1. Google Blog, "Teachable Machine 2.0 makes AI easier for everyone" (2019): https://blog.google/technology/ai/teachable-machine/
2. Google Blog, "Now anyone can explore machine learning, no coding required" (2017): https://blog.google/technology/ai/now-anyone-can-explore-machine-learning-no-coding-required/
3. Teachable Machine public project page / older public experience snapshot: https://teachablemachine.withgoogle.com/v1/
4. TensorFlow.js homepage: https://js.tensorflow.org/
5. Google Creative Lab, `teachablemachine-community` repository: https://github.com/googlecreativelab/teachablemachine-community
6. TensorFlow Blog, "Build sound classification models for mobile apps with Teachable Machine and TFLite" (2020): https://blog.tensorflow.org/2020/12/build-sound-classification-models-for-mobile-apps-with-teachable-machine-and-tflite.html
