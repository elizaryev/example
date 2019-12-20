<# This script renames your template by replacing all 'template' and 'Template' entries by 'newname' and 'NewName'
   strings (Assuming your input was 'NewName') and by replacing all occurencies of your Template by new name you defined#>
$NewProjectName = Read-Host -Prompt 'Input new project name. Be sure the path to your project doesn\t contain the name you typed.'
$NewProjectName = $NewProjectName.Trim()
$TemplatePattern = "Template"
$TemplatePatternLowCase = $TemplatePattern.ToLower()

if ([string]::IsNullOrEmpty($NewProjectName)) {
	Write-Host "You should specify a new name for your template" 
	Exit
}

Write-Host "NewProjectName:"+ $NewProjectName

<# Rename all the files which name is matching to $TemplatePattern #>
Get-ChildItem -recurse -Filter "*$TemplatePatternLowCase*" | Rename-Item -NewName {$_.name -replace $TemplatePatternLowCase,$NewProjectName}

Write-Host "begin..."

<# Replace all $TemplatePattern by $NewProjectName excluding this script file#>
Get-ChildItem -recurse -exclude "*RenameProject.ps1*" | Select-String -pattern $TemplatePattern.ToLower() | group path | ForEach { 
(Get-Content $_.name).replace($TemplatePattern, $NewProjectName).replace($TemplatePatternLowCase,$NewProjectName.ToLower()) | Set-Content $_.name 
 } 

Write-Host "Congratulations! Now your project has a new name!"