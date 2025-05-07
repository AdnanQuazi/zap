const { HELP_BLOCKS } = require("../../constants/config")

module.exports = async ({ack, respond}) => {
    try {
        await ack()
        await respond(HELP_BLOCKS())
    } catch (error) {
        await respond({
            text: "⚠️ Something went wrong. Please try again later.",
        })
        console.error("Error in zap-help command:", error)
    }
}