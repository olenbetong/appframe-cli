import {
  DataHandlerFactory,
  DataObject,
  DataObjectOptions,
  Procedure,
} from "@olenbetong/data-object";

type AppframeCore = {
  article: {
    dataObjects?: Record<string, DataObject<unknown>>;
    procedures?: Record<string, Procedure<unknown, unknown>>;
    hostName: string;
    i18n: Record<string, string>;
    id: string;
  };
  common?: {
    getLocalizedString?: (string) => string;
  };
  controls?: {
    alert?: (message: string, callback?: () => void) => void;
    confirm?: (options: {
      title: string;
      message: string;
      buttons: string[];
      callback: (button: number) => void;
    }) => void;
  };
  data: {
    [index: string]: DataHandlerFactory;
  } & { version?: string };
  DataObject: { new <T>(options: DataObjectOptions<T>): DataObject<T> };
  Procedure: { new <T, V>(options: any): Procedure<T, V> };
  userSession: {
    culture: string;
    domain: string;
    expired: (callback: () => void) => void;
    isDeveloper: boolean;
    login: string;
    uiculture: string;
  };
};

declare global {
  var af: AppframeCore;
  interface Window {
    af: AppframeCore;
  }
}
