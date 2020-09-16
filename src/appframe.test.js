const dotenv = require("dotenv");
const { AppframeApiClient } = require("./appframe");

dotenv.config();

const { APPFRAME_LOGIN: username, APPFRAME_PWD: password, APPFRAME_DEVHOST: devHost } = process.env;

describe("AppframeApiClient", () => {
  const client = new AppframeApiClient({ hostname: devHost, username, password });

  beforeEach(() => {
    client.logout();
  });

  test("failed login returns success false", async () => {
    let outputData = "";
    const storeLog = (inputs) => (outputData += inputs);

    console["warn"] = jest.fn(storeLog);
    const client = new AppframeApiClient({ hostname: devHost, username: "asdfjkl", password: "asdfjkl" });
    const auth = await client.login();

    expect(auth).toBeTruthy();
    expect(auth).toHaveProperty("success");
    expect(auth.success).toBe(false);
  });

  test("can create, get, update and delete records", async () => {
    await client.login();

    let testPath1 = `jest-test-appframe.${Math.floor(Math.random() * 5000000).toString(16)}.js`;
    let testPath2 = `jest-test-appframe.${Math.floor(Math.random() * 5000000).toString(16)}.js`;

    const existing = await client.retrieve("stbv_WebSiteCMS_GlobalComponents", {
      fields: ["PrimKey", "Path", "Content"],
      filterString: `[Path] = '${testPath1}'`,
    });

    if (existing && existing.length > 0) {
      await client.destroy("stbv_WebSiteCMS_GlobalComponents", existing[0].PrimKey);
    }

    const result = await client.create("stbv_WebSiteCMS_GlobalComponents", {
      fields: ["PrimKey", "Path"],
      Path: testPath1,
    });

    expect(result).toBeTruthy();
    expect(result.length).toBe(1);
    expect(result[0].Path).toEqual(testPath1);

    let primKey = result[0].PrimKey;
    const records = await client.retrieve("stbv_WebSiteCMS_GlobalComponents", {
      fields: ["PrimKey", "Path"],
      filterString: `[PrimKey] = '${primKey}'`,
    });

    expect(records).toBeTruthy();
    expect(records[0].PrimKey).toEqual(primKey);
    expect(records[0].Path).toEqual(testPath1);

    const [updated] = await client.update("stbv_WebSiteCMS_GlobalComponents", primKey, {
      fields: ["Path", "PrimKey"],
      Path: testPath2,
    });

    expect(updated).toBeTruthy();
    expect(updated.Path).toEqual(testPath2);

    const isDeleted = await client.destroy("stbv_WebSiteCMS_GlobalComponents", primKey);

    expect(isDeleted).toBe(true);

    const noData = await client.retrieve("stbv_WebSiteCMS_GlobalComponents", {
      fields: ["PrimKey"],
      filterString: `[PrimKey] = '${primKey}'`,
    });

    expect(noData.length).toBe(0);
  });
});
