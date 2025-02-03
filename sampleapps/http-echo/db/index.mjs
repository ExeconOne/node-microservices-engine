export const dbInit = async (appDb) => {
    await appDb.run("CREATE TABLE IF NOT EXISTS config (name TEXT PRIMARY KEY, value TEXT)");
}
// module.exports = {
//     dbInit
// }