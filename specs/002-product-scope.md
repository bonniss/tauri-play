# 002 Product Scope

## Purpose

This document defines the first product scope for our app.

The app is inspired by Teachable Machine and Lobe. The goal is a local-first desktop tool where users create image classification projects, collect labeled samples, train a model, and test it live — all offline, all on their machine.

## Product Position

This is a practical learning tool.

It should feel fast, direct, and satisfying to use. The value comes from the feedback loop: you collect images, you train, you see what works and what doesn't.

It should help users understand:

- what a dataset is
- how labels affect what the model learns
- why more or better examples change outcomes
- why models can fail
- what confidence scores mean

## Core Product Principles

- offline-first
- local-first
- project-based
- beginner-friendly
- fast iteration loop

## Main User

Primary:

- students
- teachers
- self-learners
- workshop participants

Secondary:

- creators and developers who want a simple local prototype tool

## Mental Model

A **Project** is the top-level unit of work. Each project is one classification task.

Examples:

- "Finger Counting" — classes: One, Two, Three, Four, Five
- "Drink Tracker" — classes: Drinking, Not Drinking
- "Rock Paper Scissors" — classes: Rock, Paper, Scissors

Each project has its own classes, its own samples, and its own trained model. Projects are independent from each other.

```
Project "Finger Counting"
  └── classes: One, Two, Three, Four, Five
  └── samples per class
  └── trained model

Project "Drink Tracker"
  └── classes: Drinking, Not Drinking
  └── samples per class
  └── trained model
```

This is the only mental model users need to hold. There is no concept of multiple training runs or model versions inside one project in v1.

## Product Shape

```
project list → create / open project → label → train → play
```

The three main views inside a project map directly to the sidebar in the UI:

- **Label** — manage classes, capture or import samples
- **Train** — trigger training, see progress and basic results
- **Play** — test the model live with the webcam

This matches the Lobe-style three-step sidebar visible in the reference screenshot.

## Core Entities

### Project

The container for one classification task.

Fields:

- `id`
- `name`
- `taskType` — image classification only for v1
- `createdAt`
- `updatedAt`

### Class

A label the model should learn to recognize.

Fields:

- `id`
- `projectId`
- `name`
- `createdAt`

### Sample

One captured or imported training image.

Fields:

- `id`
- `projectId`
- `classId`
- `filePath`
- `source` — `camera` or `upload`
- `createdAt`

### Model

The trained artifact for a project. One model per project in v1.

Fields:

- `id`
- `projectId`
- `artifactPath` — path to the saved TensorFlow.js model folder
- `trainedAt`
- `accuracy` — optional top-level summary metric

## Feature Set

### v1 Must-Have

- project list screen — create, open, delete projects
- class management — add, rename, delete classes
- sample collection — webcam capture and file upload per class
- sample review — see thumbnails, delete individual samples
- sample count per class with minimum guidance (5 images needed to train)
- one-click training with a progress indicator
- save trained model to disk
- live prediction view using the webcam
- confidence bar per class in the prediction view
- basic persistence — projects and samples survive app restart

### v1.1 Additions

- class balance warnings
- training accuracy summary after training completes
- export model for use outside the app
- import existing image folders as samples
- rename or duplicate a project

### Later

- audio classification
- pose classification
- confusion matrix view
- per-class sample quality hints
- teacher presentation mode

## Navigation

The app has two levels:

1. **Project list** — the home screen, shows all saved projects
2. **Project view** — opens one project with a three-tab sidebar: Label, Train, Play

There is no deep navigation beyond these two levels in v1.

## Non-Goals For v1

- multiple training runs or model version history inside one project
- cloud sync
- collaborative multi-user editing
- advanced model architecture editing
- production-grade deployment pipelines
- audio or pose modalities

## Storage Layout

```
app-data/
  base-model/
    model.json
    weights.bin
  projects/
    <project-id>/
      samples/
        <class-id>/
          <sample-id>.jpg
      model/
        model.json
        weights.bin
  app.db
```

`app.db` holds all metadata: projects, classes, samples, model records.

Files on disk hold the actual images, the base model, and trained project model artifacts.

## Offline / Local-First Requirements

The app runs entirely on the user's machine. There is no server, no cloud sync, no backend of any kind.

**One-time setup requirement:**

The first time the app launches, it needs an internet connection to download the base model (MobileNet, ~18MB) from a public CDN. This is downloaded once and saved to `app-data/base-model/`. Every launch after that loads the base model from disk — no internet needed.

The app must make this requirement clear and honest:

- on first launch, show a setup screen explaining what is being downloaded and why
- show download progress
- do not proceed to the project list until the download is complete and verified
- if the download fails, show a clear error with a retry option

After the one-time setup:

- all projects and samples are stored locally
- training runs entirely in the app using the saved base model
- inference runs entirely in the app
- the app works fully offline indefinitely