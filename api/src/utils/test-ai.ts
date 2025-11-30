/**
 * Simple test script for AI chat functionality
 * Run with: npx ts-node src/utils/test-ai.ts
 */

import { AIProviderFactory } from "../controllers/ai-providers";
import { chatContext, userContext } from "../constants/contexts";

async function testAIChat() {
  console.log("🤖 Testing ZetaConfluence AI Chat Assistant\n");

  try {
    // Check if API key is set
    if (!process.env.OPENAI_API_KEY) {
      console.error("❌ OPENAI_API_KEY not found in environment variables");
      console.log("Please set OPENAI_API_KEY in your .env file");
      return;
    }

    console.log("✅ API key found");
    console.log("📝 Creating AI provider...\n");

    // Create provider
    const provider = AIProviderFactory.createProvider("openai", "gpt-4o-mini");

    // Build context
    const systemContext = chatContext();
    const userSpecificContext = userContext({
      userAddress: "0x1234567890123456789012345678901234567890",
      currentChain: "ZetaChain",
      userTokens: ["BTC", "ETH", "USDC"],
    });

    // Test message
    const testMessage = "What is ZetaConfluence and how does it work?";
    console.log(`💬 Sending test message: "${testMessage}"\n`);

    const messages = [
      {
        role: "system" as const,
        content: `${systemContext}\n\n${userSpecificContext}`,
      },
      {
        role: "user" as const,
        content: testMessage,
      },
    ];

    // Send message
    const response = await provider.sendMessage(messages);

    console.log("✅ Response received!\n");
    console.log("📊 Usage:");
    console.log(`   - Prompt tokens: ${response.usage?.prompt_tokens}`);
    console.log(`   - Completion tokens: ${response.usage?.completion_tokens}`);
    console.log(`   - Total tokens: ${response.usage?.total_tokens}\n`);
    console.log("💬 AI Response:");
    console.log("─".repeat(80));
    console.log(response.message);
    console.log("─".repeat(80));
    console.log("\n✅ Test completed successfully!");
  } catch (error: any) {
    console.error("\n❌ Test failed:");
    console.error(error.response?.data || error.message);
  }
}

// Run test
testAIChat();
