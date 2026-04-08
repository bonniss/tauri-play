# 004 Camera Capture Flow

## Purpose

This document defines the first camera-driven workflow for the app.

The goal is to build the capture foundation for image classification before building broader project management.

## Scope

This phase covers:

- webcam preview
- image capture
- local image persistence
- sample metadata persistence
- per-class sample organization
- one hidden project id for the current working session

This phase does not yet require:

- visible project management UI
- multiple user-created projects
- training UI polish
- advanced dataset inspection

## Product Decision

Even though we are not building project management first, we should still store data in a project-shaped structure from day one.

That means:

- each working session gets one hidden project id
- all captured images for that session live under a folder for that id
- later, this hidden id can become the real project id without changing the storage model

## Core Rule

On app open, if there is no active working session yet, generate one hidden project id and use it as the storage root for captures.

For now:

- one app session maps to one implicit project
- the user does not need to manage that project explicitly

Later:

- this id becomes the real project id
- explicit project management can be added on top

## Storage Direction

Captured images should be stored as files on disk.

Metadata should be stored in SQLite.

Recommended shape:

```text
app-data/
  projects/
    <project-id>/
      samples/
        <class-id>/
          <sample-id>.jpg
  app.db
```

This structure is important because it already matches the future product shape:

- project
- class
- samples

## Entities Needed Now

### Hidden Project Session

Represents the current working project, even though the UI does not expose it yet.

Suggested fields:

- `id`
- `createdAt`
- `updatedAt`
- `status`

### Class

Represents a label/category for image classification.

Suggested fields:

- `id`
- `projectId`
- `name`
- `createdAt`

### Sample

Represents one captured image.

Suggested fields:

- `id`
- `projectId`
- `classId`
- `path`
- `source`
- `createdAt`

For now, `source` can be:

- `camera`
- `upload`

## Camera Flow

### 1. Open camera

The app should:

- request webcam permission
- show a live preview
- show a clear error state if permission fails or no device exists

### 2. Select target class

Before capture, the user must choose which class the sample belongs to.

The app should always know the current target class before saving a sample.

### 3. Capture frame

When the user captures:

- grab the current video frame
- convert it to an image
- persist it under the hidden project folder
- create sample metadata in SQLite
- update the UI immediately

### 4. Show local result

After capture, the app should:

- increment the sample count
- show the latest thumbnail
- keep the preview running

## UX Requirements

The first camera UX should be simple.

It should include:

- live preview
- current class selection
- capture button
- sample count per class
- latest captured items

It should avoid:

- too many controls
- advanced training settings
- project naming or project switching

## Technical Requirements

### Camera access

Use browser media APIs in the Tauri webview.

At minimum, the app must handle:

- permission granted
- permission denied
- no camera found
- camera stream interrupted

### Capture output

The capture pipeline should produce a real image file, not just in-memory preview data.

Why:

- files are needed for later training
- files survive app restart
- files are easier to inspect and debug

### Persistence

The capture flow is not complete until both of these succeed:

- image file written to disk
- sample metadata written to SQLite

If one succeeds and the other fails, the app should treat that as an error state and recover cleanly.

## Recommended Build Order

### 1. Hidden project id bootstrap

Build:

- generate one implicit project id
- persist it for the current working context

Done means:

- the app always has a storage root before capture starts

### 2. Camera preview

Build:

- webcam permission request
- preview stream
- basic error states

Done means:

- user can see a stable live preview

### 3. Frame capture

Build:

- capture one frame from the preview
- convert frame into an image blob/file

Done means:

- the app can produce a valid image from the camera

### 4. File persistence

Build:

- create folder path from hidden project id and class id
- write captured image to disk

Done means:

- the file exists in the correct local folder

### 5. Metadata persistence

Build:

- save sample record in SQLite
- load sample count by class

Done means:

- restart does not lose sample state

### 6. Capture UI feedback

Build:

- count updates
- latest sample preview
- simple sample list

Done means:

- users can feel progress while collecting data

## Risks

- camera behavior may vary across devices
- webview camera support may differ from normal Chrome behavior
- file writing must be coordinated with capture timing
- repeated capture can create too many near-duplicate samples

## Open Questions

- Should the hidden project id survive app restart until the user explicitly resets it?
- Should class ids also map directly to folder names, or should folder names stay separate from display names?
- What image format should v1 store by default: jpeg or png?
- Do we want single-shot capture only first, or also burst capture soon after?
