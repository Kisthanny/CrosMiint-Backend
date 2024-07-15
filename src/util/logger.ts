import Log from "../models/logModel";

const logger = async (
    content: string,
    kind: string = "info",
) => {
    await Log.create({ content, kind });
};

export default logger;