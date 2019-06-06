const installCommand = require("./index");
const { getRequiredCommandParameters } = require("./common");
const { InstallClient } = require("./client");
const dotenv = require("dotenv");

dotenv.config();

const { APPFRAME_LOGIN: username, APPFRAME_PWD: password, APPFRAME_HOSTNAME: hostname } = process.env;

describe("Install command", () => {
  const client = new InstallClient({ hostname: "test.synergi.olenbetong.no", password, username });

  test("installs without error", async () => {
    const auth = await client.login();

    expect(auth.success).toBe(true);

    await client.installLocalComponent(hostname);
  });

  test("install from command line", async () => {
    await installCommand({
      domain: "test.synergi.olenbetong.no",
      hostname,
      username,
      password
    });
  });

  test("get missing parameters", async () => {
    let readCount = 0;
    const values = [hostname, "", username, password];
    const mockReadline = {
      close: () => null,
      questionAsync: () => Promise.resolve(values[readCount++])
    };

    const config = await getRequiredCommandParameters({}, mockReadline);

    expect(config).toEqual({
      domain: hostname,
      hostname,
      username,
      password
    });
  });
});
