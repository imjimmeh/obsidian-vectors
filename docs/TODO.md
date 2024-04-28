## TODO

### Chat

-   [ ] Add ability to enable/disable document retrieval
-   [x] Make chat prettier
-   [x] Enter button to send message
-   [ ] Show "thinking" status whilst waiting for message
-   [ ] Clear chat option
-   [ ] User can add only certain documents for RAG
-   [ ] User can add full documents of retrieved sources for RAG
-   [ ] Prettify AI sources
-   [ ] User can click source to open document
-   [ ] User can click source to add to RAG
-   [ ] Disable chat button whilst waiting for AI response
-   [x] Filter docs by score

### LLM

-   [ ] Agentness
-   [ ] LLM can edit document
-   [ ] Add memory

### Retrieval

-   [x] Add similarity score retrieval
-   [x] Add multiquery retrieval
-   [ ] Add self query retrieval
-   [ ] Add multivector retrieval
-   [ ] Add parent document retrieval

_Note_: Need to play around with all of these once done. I think some combination of them will be extremely effective, but unsure what. Will add them all and play around.

### Vectors

-   [x] Use tags as metadata somehow (and maybe backlinks?)
-   [ ] Embed other document types
-   [x] Save tags as metadata
-   [x] Save links as metadata
-   [ ] Save backlinks as metadata?

### Settings

-   [ ] Ability to cancel initial embedding
-   [ ] Setting(s) to filter what documents can be embedded
-   [ ] Setting for collection name
-   [ ] Setting to tweak min similarity score

### UI

-   [ ] Change icon on left bar for the chat open window
-   [ ] Add embedding status to status bar
-   [ ] Add command to open chat window

### Other

-   [x] Add read me
-   [ ] Add other docs
-   [ ] Add logging
-   [ ] Think of a better name...
-   [ ] Use the Obsidian Tasks API to move embeddings (and whatever else is appropriate) to background thread

#### LONG TERM

-   [ ] Support other LLMs
-   [ ] Support other vector databases
-   [ ] Support other embeddings

## Dev Log

### 27/04/2024

-   Made chat prettier. Could do with more work but good for now IMO.
-   Instead of enter to send message, shift+enter was chosen.
-   Added buttons in settings to initialise or delete Vector container

### 28/04/2024

-   Add frontmatter to embeddings
-   Add document name as embedding header
-   Similarity score + multi query retrieval added. Took a fair bit of tweaking but seems much better. Need to add settings.
