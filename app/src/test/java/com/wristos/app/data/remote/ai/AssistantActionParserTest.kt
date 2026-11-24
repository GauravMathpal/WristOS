package com.wristos.app.data.remote.ai

import org.junit.Assert.*
import org.junit.Test

class AssistantActionParserTest {

    private val client = GeminiAssistantClient()

    @Test
    fun testParseTaskAction() {
        val rawAiResponse = "I've added that to your list. [ACTION:TASK|Review BLE Specs|Today 5 PM]"
        val reply = client.parseAssistantReply(rawAiResponse)

        assertEquals("I've added that to your list.", reply.replyText)
        assertTrue(reply.action is AssistantAction.CreateTask)

        val taskAction = reply.action as AssistantAction.CreateTask
        assertEquals("Review BLE Specs", taskAction.title)
        assertEquals("Today 5 PM", taskAction.dueTime)
    }

    @Test
    fun testParseMemoryAction() {
        val rawAiResponse = "Got it! I will remember that. [ACTION:MEMORY|Health|Daily target 10000 steps]"
        val reply = client.parseAssistantReply(rawAiResponse)

        assertEquals("Got it! I will remember that.", reply.replyText)
        assertTrue(reply.action is AssistantAction.SaveMemory)

        val memAction = reply.action as AssistantAction.SaveMemory
        assertEquals("Health", memAction.tag)
        assertEquals("Daily target 10000 steps", memAction.fact)
    }

    @Test
    fun testParseWatchAlertAction() {
        val rawAiResponse = "Alert sent to PineTime! [ACTION:ALERT|Focus Time!]"
        val reply = client.parseAssistantReply(rawAiResponse)

        assertEquals("Alert sent to PineTime!", reply.replyText)
        assertTrue(reply.action is AssistantAction.WatchAlert)

        val alertAction = reply.action as AssistantAction.WatchAlert
        assertEquals("Focus Time!", alertAction.message)
    }

    @Test
    fun testParsePlainResponseWithoutAction() {
        val rawAiResponse = "You have walked 4,500 steps today, keep going!"
        val reply = client.parseAssistantReply(rawAiResponse)

        assertEquals("You have walked 4,500 steps today, keep going!", reply.replyText)
        assertTrue(reply.action is AssistantAction.None)
    }

    @Test
    fun testOfflineColloquialTaskParsing() {
        val reply = client.generateOfflineResponse("i have complete xyz task by tmr 5pm")
        assertTrue(reply.action is AssistantAction.CreateTask)
        val task = reply.action as AssistantAction.CreateTask
        assertEquals("Xyz task", task.title)
        assertEquals("Tomorrow, 5:00 PM", task.dueTime)
    }

    @Test
    fun testBareHourAndMilitaryTaskParsing() {
        val (bareTitle, bareDue) = GeminiAssistantClient.extractTaskDetails("Finish assignment by 5")
        assertEquals("Finish assignment", bareTitle)
        assertEquals("Today, 5:00 PM", bareDue)

        val (milTitle, milDue) = GeminiAssistantClient.extractTaskDetails("Submit report at 17:30")
        assertEquals("Submit report", milTitle)
        assertEquals("Today, 5:30 PM", milDue)
    }

    @Test
    fun testFallbackWhenLlmOmitsActionTag() {
        val reply = client.parseAssistantReply(
            rawText = "I don't have that yet.",
            userPrompt = "i have to finish reading by tonight"
        )
        assertTrue(reply.action is AssistantAction.CreateTask)
        val task = reply.action as AssistantAction.CreateTask
        assertEquals("Reading", task.title)
        assertEquals("Tonight, 9:00 PM", task.dueTime)
    }
}
