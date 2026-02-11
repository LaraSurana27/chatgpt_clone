
const { Pinecone } = require('@pinecone-database/pinecone')

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

const cohortChatGptIndex = pc.index({
  name: process.env.PINECONE_INDEX_NAME || "cohort-chatgpt",
})

async function createMemory({ vectors, metadata, messageId }) 
{
  await cohortChatGptIndex.upsert({
  records: [
    {
      id: messageId,
      values: vectors,
      metadata,
    },
  ],
})
}

async function queryMemory({ queryVector, limit = 5, metadata}) 
{
    const data = await cohortChatGptIndex.query({
        vector : queryVector,
        topK : limit,
        filter : metadata || undefined,
        includeMetadata : true,
    })
    return data.matches
}

module.exports = {
    createMemory,
    queryMemory,
}
