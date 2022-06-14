<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="shortcut icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <title>Partner: My Application</title>

    <!-- {Theme} -->
  </head>

  <body class="theme-ncgroup">
    <header class="partner-header">
      <nav class="partner-nav">
        <a href="#content" class="c-skip-nav visually-hidden"
          >Skip to content</a
        >
        <div id="sidebar-menu-toggle" class="d-none"></div>

        <a
          class="partner-nav__brand"
          href="/"
          aria-label="Go to the front page"
        >
          <img
            src="/file/site/graphic/NCGhvit.svg"
            width="278"
            height="48"
            alt=""
            class="partner-nav__logo"
          />
        </a>

        <ol class="partner-breadcrumb">
          <li class="partner-breadcrumb__item partner-breadcrumb__item--active">
            <a
              href="/dashboard"
              class="
                partner-breadcrumb__item-link
                partner-breadcrumb__item-link--active
              "
              >Dashbord</a
            >
          </li>
        </ol>

        <script
          type="module"
          src="/file/component/modules/ob-disclosure-nav@1.0.0/index.min.js"
        ></script>
        <ob-disclosure-nav>
          <ul class="c-dev">
            <li>
              <button aria-expanded="false" aria-controls="DevtoolsEditMenu">
                <svg style="width: 24px; height: 24px" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M6,2C4.89,2 4,2.89 4,4V20A2,2 0 0,0 6,22H10V20.09L12.09,18H6V16H14.09L16.09,14H6V12H18.09L20,10.09V8L14,2H6M13,3.5L18.5,9H13V3.5M20.15,13C20,13 19.86,13.05 19.75,13.16L18.73,14.18L20.82,16.26L21.84,15.25C22.05,15.03 22.05,14.67 21.84,14.46L20.54,13.16C20.43,13.05 20.29,13 20.15,13M18.14,14.77L12,20.92V23H14.08L20.23,16.85L18.14,14.77Z"
                  />
                </svg>
              </button>
              <ul id="DevtoolsEditMenu" style="display: none">
                <li><h2>Apper &amp; artikler</h2></li>
                <li>
                  <a
                    href="https://dev.obet.no/appdesigner?partner.olenbetong.no"
                    >Ny applikasjon</a
                  >
                </li>
                <li>
                  <a
                    href="https://dev.obet.no/appdesigner?partner.olenbetong.no/dashboard"
                    >Rediger app</a
                  >
                </li>
                <li><a href="/appdesigner-articlelist">Artikkelliste</a></li>
              </ul>
            </li>
            <li>
              <button
                aria-expanded="false"
                aria-controls="DevtoolsDevMenu"
                title="Utvikling"
              >
                <svg style="width: 24px; height: 24px" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M13,9H18.5L13,3.5V9M6,2H14L20,8V20A2,2 0 0,1 18,22H6C4.89,22 4,21.1 4,20V4C4,2.89 4.89,2 6,2M6.12,15.5L9.86,19.24L11.28,17.83L8.95,15.5L11.28,13.17L9.86,11.76L6.12,15.5M17.28,15.5L13.54,11.76L12.12,13.17L14.45,15.5L12.12,17.83L13.54,19.24L17.28,15.5Z"
                  />
                </svg>
              </button>
              <ul id="DevtoolsDevMenu" style="display: none">
                <li><h2>Utvikler</h2></li>
                <li>
                  <a href="https://dev.obet.no/af-dbmanager">DB Manager</a>
                </li>
                <li>
                  <a href="https://dev.obet.no/code-modules">Code Modules</a>
                </li>
                <li>
                  <a href="https://dev.obet.no/af-assemblies">Assemblies</a>
                </li>
                <li>
                  <a href="https://dev.obet.no/sitesetup?partner.olenbetong.no"
                    >Site Setup</a
                  >
                </li>
                <li><a href="https://dev.obet.no/af-bundle">Bundles</a></li>
                <li><a href="https://dev.obet.no/af-updater">Updater</a></li>
                <li>
                  <a href="https://dev.obet.no/af-scheduler">Scheduler</a>
                </li>
              </ul>
            </li>
            <li>
              <button
                aria-expanded="false"
                aria-controls="DevtoolsDebugMenu"
                title="Debugging"
              >
                <svg style="width: 24px; height: 24px" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M14,12H10V10H14M14,16H10V14H14M20,8H17.19C16.74,7.22 16.12,6.55 15.37,6.04L17,4.41L15.59,3L13.42,5.17C12.96,5.06 12.5,5 12,5C11.5,5 11.04,5.06 10.59,5.17L8.41,3L7,4.41L8.62,6.04C7.88,6.55 7.26,7.22 6.81,8H4V10H6.09C6.04,10.33 6,10.66 6,11V12H4V14H6V15C6,15.34 6.04,15.67 6.09,16H4V18H6.81C7.85,19.79 9.78,21 12,21C14.22,21 16.15,19.79 17.19,18H20V16H17.91C17.96,15.67 18,15.34 18,15V14H20V12H18V11C18,10.66 17.96,10.33 17.91,10H20V8Z"
                  />
                </svg>
              </button>
              <ul id="DevtoolsDebugMenu" style="display: none">
                <li><h2>Debug</h2></li>
                <li><a href="/api/debug/cache">Cache-styring</a></li>
                <li><a href="/api/debug/razor">Razor</a></li>
                <li><a href="/api/debug/placeholders">Stedholdere</a></li>
                <li><a href="/api/debug/routes">Ruter</a></li>
                <li><a href="/api/debug/trace">DB Trace</a></li>
                <li><a href="/api/debug/profiler">DB Profiler</a></li>
                <li><a href="/api/debug/errors">Feil</a></li>
                <li><a href="/api/debug/modules">Moduler</a></li>
                <li><a href="/api/debug/assemblies">Monteringer</a></li>
              </ul>
            </li>
            <li>
              <button
                aria-expanded="false"
                aria-controls="AdministrationMenu"
                title="Administrasjon"
              >
                <svg style="width: 24px; height: 24px" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"
                  />
                </svg>
              </button>
              <ul id="AdministrationMenu" style="display: none">
                <li><h2>Min konto</h2></li>
                <li><a href="/change-customer" class="">Bytt kunde</a></li>
                <li><a href="/manage-user/bvh">Endre min konto</a></li>
                <li><h2>Kunder</h2></li>
                <li><a href="/manage-users" class="">Brukere</a></li>
                <li><a href="/manage-customers" class="">Firmaer</a></li>
                <li><a href="/manage-roles" class="">Tilgangsroller</a></li>
                <li><h2>Data</h2></li>
                <li>
                  <a href="/delivered-invoiced-diff" class=""
                    >Levert/fakturert</a
                  >
                </li>
                <li><a href="/manage-projects" class="">Prosjekter</a></li>
                <li>
                  <a href="/manage-key-figures" class="">N&#248;kkeltall</a>
                </li>
              </ul>
            </li>
            <li>
              <button aria-expanded="false" aria-controls="NavbarUserMenu">
                <span class="partner-nav__dropdown-name">Demo User</span>
                <svg style="width: 24px; height: 24px" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12,19.2C9.5,19.2 7.29,17.92 6,16C6.03,14 10,12.9 12,12.9C14,12.9 17.97,14 18,16C16.71,17.92 14.5,19.2 12,19.2M12,5A3,3 0 0,1 15,8A3,3 0 0,1 12,11A3,3 0 0,1 9,8A3,3 0 0,1 12,5M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12C22,6.47 17.5,2 12,2Z"
                  />
                </svg>
              </button>
              <ul id="NavbarUserMenu" style="display: none">
                <li><a href="/manage-users">Brukeradministrasjon</a></li>
                <li><a href="/change-customer">Bytt kunde</a></li>
                <li class="dropdown-divider"></li>

                <li><a href="/change-password">Bytt passord</a></li>
                <li><a href="/logout">Logg ut</a></li>
              </ul>
            </li>
          </ul>
        </ob-disclosure-nav>
      </nav>
    </header>

    <div id="root"></div>
    
    <script src="/lib/@olenbetong/appframe-core/1.0.2/dist/iife/af.common.js"></script>
    <script src="/lib/@olenbetong/appframe-data/0.1.2/dist/iife/af.data.js"></script>
    <!-- {Appframe} -->
    <script type="module" src="/src/index.tsx"></script>
		<script src="/file/site/script/ob.es.navbar.jsx"></script>
  </body>
</html>
