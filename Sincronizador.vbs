' MOTOR MAESTRO DE PERSISTENCIA DURO - EJECUCIÓN INVISIBLE EN SEGUNDO PLANO
Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")

' Calcular la ruta de la red compartida y el directorio de descargas del usuario de Windows
userProfile = shell.ExpandEnvironmentStrings("%USERPROFILE%")
downloadFolder = userProfile & "\Downloads"
currentDir = fso.GetAbsolutePathName(".")

dbDataFile = currentDir & "\db_data.js"

' Bucle infinito de escucha de disco duro síncrono (Consumo 0% de CPU y RAM)
Do
    WScript.Sleep 500 ' Revisa el disco cada medio segundo
    
    targetFile = ""
    ' 1. Verificar si el archivo temporal cayó en la carpeta local o en descargas de red
    If fso.FileExists(currentDir & "\save_request.txt") Then targetFile = currentDir & "\save_request.txt"
    If fso.FileExists(downloadFolder & "\save_request.txt") Then targetFile = downloadFolder & "\save_request.txt"
    
    If targetFile <> "" Then
        On Error Resume Next
        WScript.Sleep 200 ' Esperar a que el navegador termine de escribir el archivo completo
        
        ' Copiar el archivo temporal sobreescribiendo el script central db_data.js
        fso.CopyFile targetFile, dbDataFile, True
        
        ' Purgar los temporizadores basura para esperar el siguiente lote de trabajo del analista
        fso.DeleteFile targetFile, True
        On Error GoTo 0
    End If
Loop
