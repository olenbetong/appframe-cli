<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="shortcut icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <title>Application name</title>

    <link rel="stylesheet" href="/file/site/style/ob.theme.base.less" />
    <link rel="stylesheet" href="/file/site/style/ob.theme.betongost.less" />
    <link rel="stylesheet" href="/file/site/style/ob.theme.forsand.less" />
    <link rel="stylesheet" href="/file/site/style/ob.theme.olenbetong.less" />
    <link rel="stylesheet" href="/file/site/style/ob.theme.ribe.less" />
    <link rel="stylesheet" href="/file/site/style/ob.theme.sjb.less" />
    <link rel="stylesheet" href="/file/site/style/ob.es.application.min.css" />
  </head>
  <body class="theme-ob">
    <script type="module">
      import userSession from "/api/system/usersession" assert { type: "json" };
      globalThis.af = globalThis.af ?? {};
      globalThis.af.userSession = userSession;
    </script>
    <script src="/lib/@olenbetong/common/1.0.0-beta.1/dist/iife/common.localization.min.js"></script>
    <script src="/lib/@olenbetong/data-object/1.0.0-alpha.41/dist/iife/af.DataObject.js"></script>
    <script type="text/javascript" src="/file/article/static-script/%ARTICLE_ID%.js"></script>
    <div id="root"></div>
  </body>
</html>
