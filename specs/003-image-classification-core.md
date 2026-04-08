# 003 Image Classification Core

## Purpose

This document defines the first technical core of the product.

We are not starting from project management. We are starting from the core learning loop for image classification, because that is where the real technical constraints appear first:

- camera
- file import
- training
- inference
- storage
- model session persistence

## Product Framing

The first meaningful version of the app should prove this loop:

`collect images -> label them -> train -> test live -> save model session`

If this loop is weak, the rest of the product does not matter yet.

## Scope For This Phase

Focus on:

- image classification only
- local-only training and inference
- offline-first behavior
- persistent local storage
- multiple saved model sessions

Do not focus on:

- multi-modality
- cloud sync
- collaboration
- advanced model customization
- polished project management flows

## Main Technical Challenges

### 1. ML runtime choice

The most important decision is where training and inference run.

Practical options:

- TensorFlow.js in the webview
- native-side training/inference
- Python sidecar

Recommended v1 direction:

- use TensorFlow.js in the webview

Why:

- closest to the Teachable Machine interaction model
- fastest iteration loop
- easiest path for camera preview, image preprocessing, training, and live inference in one place

Main risk:

- performance and memory management in the webview

## 2. Image data pipeline

The app needs a clean path from captured/imported images to model-ready tensors.

Key concerns:

- image resizing
- normalization
- sample quality
- class balance
- storage format

Recommended v1 direction:

- store raw image files locally
- store metadata in SQLite
- preprocess at train/inference time
- keep augmentation out of early scope

Why:

- raw files are easier to inspect and debug
- retraining stays possible if preprocessing changes
- local-first persistence remains simple and explicit

## 3. Camera and file import

Camera support is not just a UI detail. It is part of the core system.

Key concerns:

- camera permission
- device selection
- preview stability
- capture cadence
- too many near-duplicate samples

Recommended v1 direction:

- support webcam capture
- support file upload
- keep capture workflow simple
- delay smart quality guidance until after the base loop works

## 4. Training loop

The training loop must feel interactive enough for education.

Key concerns:

- training time
- model size
- memory pressure
- user confusion around too many options

Recommended v1 direction:

- use transfer learning
- keep the backbone fixed
- expose very few training controls at first

Why:

- training from scratch is not a good beginner experience
- the app should teach the effect of data, not overwhelm users with model design

## 5. Model session persistence

This is a core differentiator for our app.

Every training run should become a saved model session.

A model session should be:

- persistent
- inspectable
- switchable
- immutable after training

Why:

- users should compare runs
- teachers should demonstrate improvement across iterations
- the app should not overwrite the previous learning state

## 6. Local-first storage design

The app must store:

- image samples
- sample metadata
- model session metadata
- model artifacts

Recommended v1 direction:

- raw image files on disk
- SQLite for metadata
- one folder per model session for artifacts

Example shape:

```text
app-data/
  samples/
  sessions/
    <session-id>/
      model/
      metrics.json
  app.db
```

This exact layout can change, but the idea should stay the same:

- files on disk
- metadata in SQLite
- sessions preserved independently

## 7. Performance and memory

This will be one of the main engineering risks.

Key concerns:

- large image batches
- unreleased tensors
- slow retraining
- inference preview causing UI lag

Implication:

- memory hygiene must be treated as a first-class concern
- the v1 architecture should favor predictable, smaller workloads

## Recommended v1 Direction

Build the first core around:

- image-only classification
- TensorFlow.js in the webview
- webcam + file upload
- raw image file storage
- SQLite metadata
- immutable saved model sessions
- local live inference

This is the narrowest version that still proves the product.

## Build Order

Use this order so the team can start implementation without over-designing too early.

### 1. Capture pipeline

Build:

- webcam preview
- image capture
- file upload
- local file persistence

Done means:

- users can create labeled image samples and see them persist locally

## 2. Storage baseline

Build:

- sample file layout
- SQLite metadata tables
- Kysely queries for samples

Done means:

- the app can reload sample data after restart

## 3. Training prototype

Build:

- TensorFlow.js training flow
- minimal preprocessing
- one fixed image classification pipeline

Done means:

- a small dataset can train locally and produce a usable model artifact

## 4. Session persistence

Build:

- create model session on every training run
- save session metadata
- save artifact path

Done means:

- training no longer overwrites the previous run

## 5. Live testing

Build:

- load one selected session
- run live prediction from webcam or selected image
- show confidence output

Done means:

- users can switch sessions and observe different results

## 6. Compare and inspect

Build:

- session list
- basic session metadata
- active session selection

Done means:

- the educational comparison value starts to appear

## Open Questions

- Which TensorFlow.js image workflow should we standardize on for v1?
- Should the app bundle all required model assets locally, or allow first-run downloads?
- Should v1 store only model artifacts, or also a dataset snapshot per session?
- What minimum metrics should be shown after training?
