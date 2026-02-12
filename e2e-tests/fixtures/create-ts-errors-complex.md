Tests delete-rename-write order
<anyon-delete path="src/main.tsx">
</anyon-delete>
<anyon-rename from="src/App.tsx" to="src/main.tsx">
</anyon-rename>
<anyon-write path="src/main.tsx" description="final main.tsx file.">
finalMainTsxFileWithError();
</anyon-write>
EOM
