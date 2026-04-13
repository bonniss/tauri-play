# 003 Image Classification Core

## Purpose

This document defines the technical core for v1 of the product.

It aligns with the current product scope:

- project-based
- image classification only
- local-first desktop app
- one model per project
- no model run history in v1

The goal is to define the implementation shape for the core loop:

`collect images -> label them -> train -> test live`

This document is technical, but it follows the product rules defined in the current scope doc.

## Product Framing

The app is built around a **Project**.

A project is one image classification task.

Examples:

- Finger Counting
- Rock Paper Scissors
- Drink Tracker

Each project owns:

- its classes
- its samples
- its trained model

In v1, a project has only **one current trained model**.

Training a project updates or replaces that model. We do **not** keep immutable training sessions, run history, or model comparisons in v1.

## Scope For This Phase

Focus on:

- image classification only
- local-only training and inference
- offline-first behavior after one-time setup
- persistent local storage
- project-based data model
- one current trained model per project

Do not focus on:

- audio classification
- pose classification
- cloud sync
- collaboration
- advanced model customization
- model version history
- run comparison workflows

## Core Product Loop

The product loop is:

`project -> labels -> samples -> train -> play`

This maps to the intended product structure:

- Project list
- Project view
  - Label
  - Train
  - Play

The technical core should support this flow directly.

## Source of Truth

For v1, the source of truth is:

- a project is the top-level unit of work
- each project has its own classes and samples
- each project has one trained model at a time
- the app must persist both metadata and files locally

This means the technical design should avoid introducing a separate "session" concept for training runs in v1.

## Main Technical Decisions

### 1. ML runtime choice

Recommended v1 direction:

- use TensorFlow.js in the webview

Why:

- it matches the interactive desktop UX we want
- camera preview, preprocessing, training, and live inference can stay in one environment
- it is the closest practical fit for a Teachable Machine-style workflow inside a Tauri app

Main risk:

- browser/webview memory pressure
- training responsiveness on weaker machines

Implication:

- keep the training pipeline narrow and predictable in v1
- treat memory cleanup and bounded workloads as first-class concerns

### 2. Training strategy

Recommended v1 direction:

- use transfer learning
- use a fixed pretrained image backbone
- expose little or no training configuration in early versions

Why:

- users should learn from data collection and labeling, not from model architecture tuning
- fixed defaults reduce confusion
- this keeps the training loop fast and beginner-friendly

In v1, the technical system should optimize for:

- short training loop
- understandable outcomes
- reproducible behavior
- simple UI

### 3. Image data pipeline

Recommended v1 direction:

- store raw image files locally
- store sample metadata in SQLite
- preprocess at train time and inference time
- do not add augmentation in the early version

Why:

- raw files are easier to inspect and debug
- preprocessing logic can change without invalidating the original dataset
- local-first persistence stays simple and transparent

### 4. Camera and file import

The app needs two sample collection paths:

- webcam capture
- file upload

Recommended v1 direction:

- keep the camera flow simple and reliable
- support single capture first, then burst / recording only if they clearly improve sample collection UX
- keep imported and captured images in the same project sample model

The camera component is a foundation for the Label step. It is not the product model itself.

### 5. Local persistence model

The app must persist:

- project metadata
- classes
- sample metadata
- sample image files
- current trained model artifact for each project

Recommended v1 direction:

- SQLite for metadata
- filesystem for image files and model artifacts

This gives the clearest local-first architecture.

## Core Entities

### Project

A project is the root entity for one image classification task.

Fields:

- `id`
- `name`
- `taskType`
- `description`
- `settings` (JSON) để mở rộng
- `createdAt`
- `updatedAt`

For v1, `taskType` is effectively fixed to image classification, but keeping the field is acceptable if it helps future extensibility.

### Class

A class is a label inside a project.

Fields:

- `id`
- `projectId`
- `name`
- `description`
- `createdAt`
- `updatedAt`

### Sample

A sample is one image example belonging to one class in one project.

Fields:

- `id`
- `projectId`
- `classId`
- `filePath`
- `source` — `camera` or `upload`
- `createdAt`

### Model

A model is the current trained artifact for a project.

Fields:

- `id`
- `projectId`
- `artifactPath`
- `trainedAt`
- `accuracy` — optional summary metric
- `createdAt`
- `updatedAt`

Important v1 rule:

- there is only one current model per project
- training updates or replaces the current model record
- we do not maintain run history in this phase

## Storage Design

Recommended baseline shape:

```text
%AppData%/
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

Rules:

* `app.db` stores metadata
* image files live on disk under the project folder
* trained model files live on disk under the project folder
* filesystem and database must stay consistent enough that the project can be reloaded after app restart

## Database Responsibilities

SQLite should store:

* projects
* classes
* sample records
* model records

The DB should **not** store raw image blobs or model binaries.

Why:

* binary assets belong on disk
* SQLite should remain the metadata index
* queries stay simple and fast
* cleanup and inspection remain manageable

## Filesystem Responsibilities

The filesystem should store:

* captured images
* uploaded image copies if the app internalizes them
* trained model artifacts
* base model assets downloaded during initial setup

The filesystem layout should be explicit and project-scoped.

## Offline / Local-First Requirement

The app is local-first.

That means:

* after initial setup, all core flows work offline
* samples are stored locally
* training runs locally
* inference runs locally
* projects can be reopened without any backend service

One-time exception:

* on first launch, the app may need internet access to download the base model and cache it locally

After that, the app should be fully usable offline.

## Technical Build Order

### 1. Project and class foundation

Build:

* project creation
* project listing
* project open flow
* class creation, rename, deletion

Done means:

* the user can create a real project and define labels inside it

### 2. Sample persistence

Build:

* webcam capture into a selected class
* file upload into a selected class
* filesystem storage for sample images
* SQLite metadata for sample records

Done means:

* samples persist across app restarts
* each project can show its classes and sample counts

### 3. Dataset review

Build:

* thumbnail list/grid per class
* delete sample
* basic sample counts
* minimum guidance for training readiness

Done means:

* the user can inspect and manage the dataset before training

### 4. Training prototype

Build:

* load project samples
* preprocess images
* train a fixed image classification pipeline
* write the trained model artifact to the project model folder
* upsert the project's current model metadata

Done means:

* the project can produce one usable current model

### 5. Play / live inference

Build:

* load the project's current model
* run webcam inference
* show confidence outputs per class

Done means:

* the user can test the current project model live

### 6. Reliability and polish

Build:

* missing model states
* empty dataset handling
* training progress UI
* helpful error states
* cleanup rules for deleted samples or deleted projects

Done means:

* the app can be used repeatedly without breaking the local project state

## UI Implications

### Label

The Label step should support:

* class management
* camera capture
* file upload
* sample review

The technical system here should make project/class/sample boundaries explicit.

### Train

The Train step should support:

* readiness checks
* one-click training
* training progress
* summary result

The Train step should not expose advanced ML controls in v1 unless they are clearly necessary.

### Play

The Play step should support:

* loading the current project model
* webcam inference
* class confidence display
* clear empty state when no model exists yet

## Important Non-Goals

These are explicitly out of scope for this phase:

* multiple saved training runs
* immutable model sessions
* comparing runs across time
* model registry inside a project
* advanced experiment tracking
* cloud sync
* collaborative workflows

If these are added later, they should be treated as a future extension of the project model, not part of the v1 core.

## Engineering Risks

### 1. Webview memory pressure

Training and live inference in the webview can cause:

* slowdowns
* retained tensors
* tab/webview instability

Mitigation:

* keep image sizes bounded
* clean up tensors aggressively
* avoid large datasets in memory at once

### 2. Filesystem / DB consistency

Because images live on disk and metadata lives in SQLite, the app can drift if writes fail halfway.

Mitigation:

* make file save and metadata write flow explicit
* prefer predictable write ordering
* add basic recovery / missing-file handling in the UI

### 3. Camera reliability

Desktop camera behavior can fail due to:

* permissions
* unavailable devices
* interrupted streams
* OS-specific quirks

Mitigation:

* surface camera states clearly
* keep capture logic isolated
* make reconnect easy

### 4. First-run model setup

If the base model is downloaded on first launch, that flow becomes critical.

Mitigation:

* dedicated first-run setup screen
* progress UI
* retry support
* verification before entering the main product flow

## Recommended Implementation Direction

Build v1 around:

* project-first architecture
* SQLite metadata
* filesystem asset storage
* TensorFlow.js in the webview
* one current model per project
* camera + file upload for sample collection
* local live inference

This is the narrowest technical shape that matches the current product scope and keeps the product coherent.

## Open Questions

* Which pretrained image backbone should be standardized for v1?
* What exact minimum sample guidance should block or warn before training?
* Should uploaded files be copied into app storage immediately, or referenced and imported lazily?
* What summary metrics are useful enough for v1 without adding too much ML complexity?
* How should retraining behave when a project already has a model: overwrite in place or replace atomically?

## Conclusion

The technical core for v1 is not a session-based experiment system.

It is a **project-based local image classification app**.

The implementation should therefore center around:

* projects
* classes
* samples
* one current trained model per project

Everything else should support that loop cleanly.
