# 005 ML Prototype Lab

## Purpose

This document defines a narrow technical spike for the ML core of the app.

The goal is not to build the full product flow yet.

The goal is to answer a simpler question first:

**Can local model training and inference run well enough inside a Tauri webview for this product direction to remain viable?**

This spec intentionally avoids full project UI, full project data modeling, and production-grade persistence flows.

It focuses on a controlled technical prototype.

## Why This Exists

The current product direction assumes:

- local-first desktop behavior
- image classification
- TensorFlow.js in the webview
- local training and local inference

Before building the full Project -> Label -> Train -> Play product flow, we should validate the ML runtime inside the actual app environment.

The main unknowns are:

- model load time
- training speed
- inference speed
- memory pressure
- UI responsiveness during training
- whether the Tauri webview behaves acceptably under this workload

This prototype exists to reduce those unknowns early.

## Non-Goals

This prototype is not intended to provide:

- final project architecture
- final project database schema
- final dataset management UI
- final model persistence UX
- final camera labeling flow
- production-grade evaluation metrics
- model version history
- a user-facing polished feature

This is an engineering probe, not a product slice.

## Core Question

This spec should help us answer:

1. Can TensorFlow.js load and run reliably inside the Tauri webview?
2. Can a small image classification model train locally without making the app unusable?
3. Can we keep memory under control with disciplined tensor cleanup?
4. Can we run prediction fast enough for a basic interactive play/test experience?
5. Is the product direction still sound if we keep TensorFlow.js in the webview?

## Technical Scope

This prototype should provide a dedicated lab page inside the app, isolated from the real product flow.

Recommended route:

```text
/ml-lab
```

This page is an internal technical tool.

It should let us:

* load a base model or small experimental model
* create or load a small labeled dataset
* train locally
* inspect timing and memory data
* run prediction on demand
* optionally save and reload a model artifact for verification

## Prototype Strategy

The prototype should be built in two steps.

### Step 1 — Tiny training proof

Use a very small controlled model and a very small dataset to prove the basic loop works:

`prepare data -> train -> predict`

This step answers:

* does training run at all in Tauri?
* how much does it block the UI?
* what does memory look like?
* how much instrumentation do we need?

This is not intended to represent the final product model.

### Step 2 — Product-shaped experiment

After the tiny proof works, move closer to the intended product direction:

* image input
* fixed feature extractor or transfer learning backbone
* classifier head training
* prediction on real images

This step is intended to give more meaningful signal about real-world feasibility.

## Recommended Build Order

### Phase A — Tiny CNN spike

Build the first version of the lab using:

* a tiny model
* synthetic or very small manually uploaded datasets
* a simple train button
* simple prediction output
* performance instrumentation

This phase should optimize for fast implementation and easy debugging.

### Phase B — Transfer learning spike

Build the second version using:

* a fixed pretrained image feature extractor
* a small trainable classification head
* real image preprocessing
* prediction on real images

This phase should optimize for realism.

## Runtime Direction

Recommended runtime direction:

* use TensorFlow.js in the webview
* do not move training into Rust
* do not introduce Python sidecars for this prototype
* do not optimize prematurely with workers before baseline measurements exist

Why:

* this matches the intended product direction
* it is the shortest path to validate the biggest technical assumption
* it keeps the prototype focused on the real environment we plan to ship

## Execution Model

### First pass

Training should run in the main webview thread first.

This is intentional.

We want to measure the visible UX cost in the simplest possible setup before adding complexity.

We should not introduce a Worker-based architecture before we have baseline numbers.

### Later, only if needed

If the baseline shows unacceptable UI blocking, possible follow-up work includes:

* moving preprocessing to a worker
* moving training orchestration to a worker
* reducing image size or batch size
* reducing dataset size or training complexity

The first prototype should measure before optimizing.

## Lab Page Structure

The `/ml-lab` page should contain the following sections.

### 1. Backend / runtime section

Shows runtime-level information such as:

* TensorFlow.js backend
* model load state
* warmup state
* basic environment notes

Actions:

* initialize runtime
* load model
* warm up model

Outputs:

* backend name
* initialization time
* model load time
* warmup time

### 2. Dataset section

Provides a minimal way to create a labeled dataset for experiments.

The lab should support two modes over time:

#### Synthetic mode

Use generated data for quick validation.

Examples:

* simple colored squares
* simple image patterns
* small deterministic mock inputs

This mode is useful because it removes camera and file import from the equation.

#### Real image mode

Use manually uploaded images for a small number of fixed classes.

Examples:

* Class A / Class B
* Rock / Paper / Scissors
* Light / Dark object

This mode is useful because it is closer to the actual product shape.

### 3. Training section

Provides explicit controls for a small experiment.

Recommended controls:

* class count
* sample count
* input image size
* batch size
* epochs
* learning rate

Recommended actions:

* build dataset
* start training
* cancel training if practical
* clear current experiment state

Outputs:

* current status
* current epoch
* loss
* accuracy if available
* elapsed time
* total train time

### 4. Prediction section

Provides a simple prediction path after training.

Actions:

* run prediction on one image
* optionally run prediction on one camera frame later
* repeat prediction multiple times for timing

Outputs:

* predicted class
* confidence per class
* single inference time
* average inference time over repeated runs

### 5. Diagnostics section

This section is critical.

It should surface data such as:

* number of tensors
* number of bytes
* memory before train
* memory after train
* memory after prediction
* memory after disposal
* timestamps for major stages

This is a technical validation page, so diagnostics are first-class UI.

## Metrics To Capture

The lab should record, display, or log at least these metrics.

### Runtime metrics

* TensorFlow.js backend name
* runtime init time
* model load time
* model warmup time

### Dataset metrics

* number of classes
* number of samples
* dataset build time
* preprocess time per image if measurable

### Training metrics

* total training time
* per-epoch time
* loss
* accuracy if available
* peak or sampled memory indicators
* tensor count before and after training

### Prediction metrics

* single prediction time
* average prediction time across multiple runs
* output confidence distribution

### UX responsiveness metrics

* visible heartbeat or lightweight counter during training
* whether UI interactions remain usable
* whether re-renders become visibly unstable

This metric group matters because apparent usability is as important as raw training success.

## Memory Discipline Requirements

Memory hygiene must be treated as a hard requirement of the prototype.

The lab code should:

* prefer `tf.tidy` around intermediate tensor creation
* dispose long-lived tensors explicitly when no longer needed
* avoid storing tensors directly in React state
* avoid keeping duplicate copies of datasets in memory unless necessary
* expose cleanup actions for debugging

The lab should make it easy to confirm whether memory returns to a reasonable level after an experiment ends.

## Model Strategy

### Phase A model

Recommended:

* a tiny sequential model or similarly small classifier

Purpose:

* validate the training loop
* validate instrumentation
* validate cleanup discipline
* validate the basic interaction flow

This model is not intended to represent the final product architecture.

### Phase B model

Recommended:

* transfer learning with a fixed pretrained feature extractor
* trainable classification head on top

Purpose:

* better approximate the intended product direction
* measure a more realistic training and inference profile
* evaluate the practicality of the webview-based ML runtime

## Input Strategy

The prototype should support small, tightly bounded input sizes.

Recommended starting point:

* square image sizes such as `96`, `128`, or `224`

The prototype should not begin with high-resolution raw inputs.

The point is not image fidelity. The point is runtime validation.

## Save / Load Verification

A limited save/load test is useful even before real project integration.

The lab may include:

* save current trained model
* reload saved model
* rerun prediction after reload

This is not the final persistence UX.

It is only a verification step to confirm that model artifacts can survive a basic round-trip inside the Tauri environment.

## Camera Integration

Camera integration is optional in the first pass.

The camera system already exists as a reusable capture foundation, but it should not be required to validate the ML runtime.

Recommended sequence:

1. synthetic data
2. manual image upload
3. optional camera frame prediction
4. later, camera-based labeled collection

This keeps the ML experiment isolated from unrelated moving parts.

## Suggested Internal Architecture

Recommended module layout:

```text
src/
  routes/
    ml-lab.tsx
  lib/
    ml/
      backend.ts
      dataset.ts
      train.ts
      predict.ts
      metrics.ts
      model-io.ts
```

### `ml-lab.tsx`

Responsibilities:

* lab UI
* controls
* progress display
* orchestration of experiment steps
* developer-facing diagnostics

### `backend.ts`

Responsibilities:

* TensorFlow.js initialization
* backend reporting
* warmup helpers

### `dataset.ts`

Responsibilities:

* synthetic dataset generation
* uploaded image preprocessing
* tensor preparation helpers

### `train.ts`

Responsibilities:

* build prototype model
* run training
* expose callbacks for metrics and progress

### `predict.ts`

Responsibilities:

* single input prediction
* repeated timing runs
* confidence formatting

### `metrics.ts`

Responsibilities:

* timing helpers
* TensorFlow memory snapshots
* diagnostic formatting

### `model-io.ts`

Responsibilities:

* limited save/load verification for prototype models

## UI Requirements

This page is internal, but it should still be readable and structured.

Requirements:

* make long-running work visible
* show loading, training, success, and error states clearly
* make all technical data easy to inspect
* keep controls grouped by concern
* make repeated experiments quick to run

This page is allowed to be technical and dense. It is not a beginner-facing product screen.

## Out-of-Scope Product Concerns

The following should remain outside this spec:

* project list
* project routing
* class CRUD
* sample persistence into project storage
* training eligibility rules based on project state
* final Train screen UX
* final Play screen UX
* final model export UX

Those belong to later product integration work.

## Risks This Prototype Should Expose

### 1. Webview UI blocking

Training may freeze or visibly degrade the UI.

This risk should be measured, not guessed.

### 2. Memory growth

Tensor leaks may accumulate across repeated experiments.

This risk should be treated as one of the most important outputs of the lab.

### 3. Model load overhead

A realistic feature extractor may load too slowly or warm up too heavily for a smooth UX.

This should be measured directly.

### 4. Inference latency

Prediction may be too slow for a satisfying interactive flow.

This must be measured both on a single run and repeated runs.

### 5. Developer complexity

If the minimal prototype already becomes too complex to reason about, that is a signal about implementation risk for the full product.

## Success Criteria

This prototype is successful if it gives grounded answers to these questions:

* local training works reliably inside Tauri
* prediction works reliably inside Tauri
* memory can be managed with disciplined cleanup
* training time is acceptable for small datasets
* inference time is acceptable for simple interactive use
* the product direction remains technically plausible

It is also successful if it shows clear limits early, because that still reduces product risk.

## Deliverables

Minimum deliverables:

* one internal lab route
* one tiny training experiment
* one prediction experiment
* one diagnostics view
* one short engineering readout summarizing the findings

Optional later deliverables:

* transfer learning experiment
* save/load verification
* optional camera prediction hook-up

## Conclusion

This spec defines a deliberately narrow ML lab inside the app.

Its purpose is to validate the core technical assumption of the product:

**that local image classification training and inference in a Tauri webview is workable enough to justify deeper product investment.**

We should prove that first, then build the broader product layers around it.
