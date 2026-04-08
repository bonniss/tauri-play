# 002 Product Scope

## Purpose

This document defines the first product scope for our app.

The app is inspired by Teachable Machine, but it is not a clone. The goal is to build a local-first educational tool for collecting examples, training simple models, comparing results, and learning through iteration.

## Product Position

This is primarily an education product.

That means the app should optimize for:

- clarity over raw power
- short learning loops
- visible cause and effect
- safe local experimentation
- easy recovery from mistakes

It should help users understand:

- what a dataset is
- how labels affect training
- why more or better examples change outcomes
- why models can fail
- how to compare training attempts

## Core Product Principles

- offline-first
- local-first
- multiple saved model sessions per project
- beginner-friendly
- fast iteration
- explicit and inspectable state

## Main User

Primary user:

- students
- teachers
- self-learners
- workshop participants

Secondary user:

- creators and developers who want a simple local prototype tool

## Product Goal

The app should let a user create a small ML project, collect examples, train multiple model sessions, compare them, and use the differences as part of the learning experience.

The comparison part matters. Unlike a simple one-model workflow, this app should preserve multiple training attempts so users can see how changing data or settings affects results.

## Non-Goals For Early Scope

- cloud sync
- collaborative multi-user editing
- advanced MLOps workflows
- large-scale dataset management
- production-grade deployment pipelines
- fully custom model architecture editing

## Core Entities

### Project

The top-level container for a learning activity.

A project contains:

- project metadata
- task type
- classes
- captured samples
- training sessions
- exported artifacts

### Class

A label/category the user wants the model to recognize.

### Sample

A captured or imported training example.

Depending on the task type, this may be:

- image
- audio
- pose-derived data

### Model Session

A saved training run inside a project.

This is a core difference from the simplest Teachable Machine flow.

A model session should preserve:

- training timestamp
- training configuration
- model artifact location
- summary metrics
- notes or label from the user

### Evaluation Result

A set of outputs used to understand model behavior, for example:

- confidence values
- per-class correctness
- confusion-style summary

## Product Shape

The base product should feel like:

`project -> collect -> train -> compare -> test -> export`

Not just:

`collect -> train -> export`

That difference is important because the educational value comes from iteration, comparison, and reflection.

## Feature Decisions

### Features We Should Keep From Teachable Machine

- simple project creation
- direct class management
- webcam / microphone / file-based sample collection
- fast local training loop
- live prediction test view
- export model artifacts

These are core to the low-friction learning experience.

### Features We Should Rebuild More Explicitly

Teachable Machine is optimized for speed and accessibility. For our educational app, some flows should be more visible and inspectable.

#### 1. Training sessions should be first-class

Instead of only caring about the latest model, the app should preserve many model sessions in one project.

Why:

- learners can compare runs
- teachers can show the effect of better data
- users can return to earlier attempts without retraining from scratch

#### 2. Dataset quality should be more visible

The app should make dataset state easier to understand, such as:

- sample count per class
- empty or weak classes
- obvious class imbalance
- recently added samples

Why:

- this is one of the most teachable parts of beginner ML

#### 3. Evaluation should be stronger than a simple preview

Teachable Machine is strong at quick testing. Our app should expand this into learning-oriented feedback.

Examples:

- confidence per class
- test history
- quick compare between model sessions
- visible failure cases

Why:

- education requires explanation, not just prediction

#### 4. Persistence should be more intentional

Because this app is local-first and offline-first, project and model persistence are not secondary features. They are part of the core product.

The app should make it easy to:

- save projects
- keep multiple model sessions
- reopen old work
- export and import project bundles later

## Recommended Early Feature Set

### v1 Must-Have

- create project
- choose task type
- create and edit classes
- capture or import samples
- review and delete samples
- train a model locally
- save each training run as a model session
- switch between saved model sessions
- run live prediction with a selected session
- basic project persistence

### v1.1 Strong Additions

- notes for model sessions
- basic session comparison
- dataset summary panel
- simple evaluation history
- export/import project package

### Later

- richer metrics
- guided capture hints
- confusion matrix
- dataset versioning
- teacher presentation mode
- lesson templates or learning exercises

## Offline / Local-First Requirements

These are not optional.

- projects must be stored locally
- samples must be stored locally
- model sessions must be stored locally
- the app must work without network access after install
- users must be able to keep multiple model sessions at the same time

This has direct product implications:

- storage layout matters
- project metadata matters
- model artifact management matters
- the app should not assume one active model overwrites all previous work

## UX Implications Of Multiple Model Sessions

If we support many model sessions, the UI should expose that clearly.

At minimum, each project should have:

- one active session
- a session list
- a way to rename sessions
- a way to inspect when and how a session was created
- a way to switch between sessions

Potential future additions:

- pin a session
- duplicate a session
- compare two sessions side by side

## Recommended Product Direction

For our app, the strongest differentiator is not "another teachable ML toy."

It is:

- a local educational ML lab
- with persistent projects
- and multiple model sessions
- designed to help users learn by comparing outcomes

That is the direction worth leaning into.

## Open Questions

These need product decisions next:

- Should v1 support only one modality first, such as image only?
- Should training configuration be exposed to users in v1, or mostly hidden?
- Should model sessions store only final artifacts, or also dataset snapshots?
- Should project export be part of v1 or v1.1?
- Do we want a teacher-facing presentation mode early?
