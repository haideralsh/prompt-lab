<br />
<div align="center">
  <img width="208" height="208" src="./docs/icon.png" alt="Logo">
  <h3 align="center">Prompt Lab</h3>
  <!-- <p align="center">
    <br />
    <a href="https://www.haider.dev/promptlab/download">Website</a>
    · 
    <a href="https://www.haider.dev/promptlab/download">Download</a>
    · 
    <a href="https://www.haider.dev/promptlab/docs">Explore the docs</a>
  </p> -->
</div>

Prompt Lab is an open-source, cross-platform desktop app for building and providing code-related context to large language models.

## Features

- Embed complete file contents directly in your prompt
- Share your project’s directory structure with LLMs
- Let LLMs view Git diffs to analyze and review code changes
- Supply LLMs with saved web documentation in Markdown format
- Deliver clear, structured instructions for better guidance
- Save and reuse frequently used instructions

<img src="./docs/screenshot.png" />

## Building from source

Refer to the [Tauri documentation](https://tauri.app/start/) for the requirements on your platform.

PromptLab uses pnpm as the package manager for dependencies. Refer to the [pnpm install instructions](https://pnpm.io/installation) for how to install it on your platform.

```bash
git clone https://github.com/haideralsh/prompt-lab
cd prompt-lab
pnpm install
pnpm tauri build
```
