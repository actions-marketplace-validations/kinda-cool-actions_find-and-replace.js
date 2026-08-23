# thinking throug this

alri so previously we thought about using a json to define regex patters.
This is better than inline bc inline wont show regex syntax errors like escaping backslashes.

Thing is with JSON is that escaping backslashes makes the regex look ugly and harder to read.
also a json would need access to workflows output/context variables. for example, a job that would output the version number of a release needs to be picked up by the json.

Using variables in JSON is getting into JS territory lol. a quick google search showed that we're getting into JSON flavours, which is niche. Logically speaking, it means we now need a build step, where we have a templating engine running through and subbing out variables from env. its ugly.

i was thinking its better to take a full stride towards JS territory. let end users define a JS file that exports a defaul tobject with `find` `replace` and `files`. i would not accept glob patterns in the `files` key bc i think its too powerful, esp for regex use.

The JS file would be dynamically imported and validated with zod.

cons of this is that its still a bit weird. like ive never seen something similar. is it better than using templates? i think so bc if we were hypothetically useing it for a readme, the readme can still be edited and amended like normal. no new syntax to learn. the js file is a bit more discrete in this sense as in you dont need create any side effects on a user's existing workflows. js files are also readible, the regex syntax is nice and more universal (instead of defining regex in JSON files). also it can offer a lot of power b/c you can hypothetically point it to an `index.js`, install dependencies and now create some really dynamic regex. for example, you can create a node app that gets the weather today, and you can set it to output the regex containing the weather today in the replace part.

why not let the js file do that directly and have the regex part be a node js pacakge, possibly an existing one?

this relates to the fundamental question: nodejs (or any other pkg) vs github action?

i think it stems down to a few things:

- does what you're building need to react to ci env? for example, the `pnpm/setup` action needs to install pnpm on a machine. you need to exec terminal commands for that, and thats what the action does for you.

- do you need to react to ci context? for example, if an event is pr, dont save cache. but if its a push, save cache. the `pnpm/setup` action offers that cache option for ya.

- do you want to automate the ci/cd process? if you're deploying a github pages app, you're automating the build process by shipping the logic, specifying the build process and then building on your ci/cd platform. cant do the same when building a github action b/c its too slow and you need to output the exact build that the user is gonna use. in other words, they dont own your logic, so they need an exact version of it, not something that is built. its also more efficient to build it once and distribute. you can also automate other parts like linting and formatting checks. that's at the core of ci/cd, making sure that's whatever integrated and deployed is up to standard and will do the same thing every time (automated).

- do you wnat to outsource the build process? with a 3rd party node package, you need to setup node, your pkg manager, download depenecies before running. with a github action, you can just have a simple js file and use it, using the action's build instead. This makes sense for stuff that isn't part of the app's logic, but instead seeks to enhance parts of the ci/cd process

now lets look at my regex actoin. there's nothing to setup on the machine. theres not much to react to events... wait. what if we're executing differnet find and replae based on worfklow context?

so one js package could worry about exporting todays' weather, and that could work on cron. another file, this time on push, might reformat pkg software (first regex) and add release notes (second regex).

why not have each file use a node pkg? bc that would mean we're bundling each file, it takes more maintenance.

so lets draw a little diagram:

```bash
--------------------------------------------------
            CI/CD as an automation engine
      --- make sure code is up to standard (CI) ---
     --- make sure deployment is consistent (CD) ---
     --- Automate dev collaboration tasks (CI/CD) ---
                      |  |  |
                      |  |  |
                    (components)
                      |  |  |
                      |  |  |
Setup ci/cd machine ---  |  --- lint/format/run tests (CI)
                         |
            -------------|------------------
            |                              |
issue/pr/docs ammends (CI/CD)     setup/build/run app comps (CD)
            |
            |
            ---- regex find/replace action
                            |
                            |
Trying to do some functionality that isnt related to app functionality.
Want to do it across different apps, i.e. must be distributable.
Want to do it with as least effort as possible, i.e. no building plz
--------------------------------------------------
```

ok so to finalize the JS file's api, is can have a default export with
the following:

```js
Array<{
    find: RegExp
    replace: string
    files: Array<string>
  }>
```

files will be an array that does not accept glob patterns since it's too powerful.
