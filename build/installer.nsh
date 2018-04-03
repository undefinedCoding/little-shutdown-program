!macro customUnInstall
	${GetParameters} $R0
	${GetOptions} $R0 "--update" $R1
	${If} ${Errors}
		RMDir /r "$APPDATA\${APP_FILENAME}"
	${endif}
!macroend
