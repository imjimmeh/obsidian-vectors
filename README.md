# Obsidian Vectors

A plugin for [Obsidian](https://obsidian.md) to enable AI powered chat with your documents.

## Why

AI chat with RAG is a great way to query information, and is becoming more and more popular. Given the quantity of markdown documents your Obsidian vault might have, the advantage of this could be huge.

The only existing Obsidian plugin that does this (that I'm aware of) currently only supports ChatGPT, unless you pay $200 for the upcoming beta. I ain't doing that, so I made my own.

## Current Features

-   Creates embeddings for all the markdown files in your vault, and saves the vectors to Chroma
-   AI chat with Ollama
-   AI chat retrieves relevant information from Chroma for yoru query

For upcoming features, check out the [TODO.md](./docs/TODO.md) file.

## Requirements

-   Obsidian...
-   A [Chroma](...) database setup somewhere
-   An [Ollama](...) instance somewhere

## Setup

1. Setup a Chroma DB instance
2. Setup Ollama
3. Pull your model of choice in Ollama.
4. In the plugin settings, add your Ollama URL + your Chroma DB URL
5. Click initialise DB; this will generate embeddings for all your existing markdown files using Ollama and add the vectors to Chroma

## Usage

Once the DB has been initialised, click on the chat button on the left bar to open up the AI chat. You can then ask it any question about your vault; it'll attempt to retrieve relevant information using the vector DB, and then respond to your query using it.
