{{/*
Expand the name of the chart.
*/}}
{{- define "nova.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "nova.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "nova.labels" -}}
helm.sh/chart: "{{ .Chart.Name }}-{{ .Chart.Version }}"
app.kubernetes.io/name: {{ include "nova.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels for a given component name
*/}}
{{- define "nova.selectorLabels" -}}
app.kubernetes.io/name: {{ include "nova.name" . }}
app.kubernetes.io/component: {{ .componentName }}
app.kubernetes.io/instance: {{ $.Release.Name }}
{{- end }}

{{/*
Image reference
*/}}
{{- define "nova.image" -}}
{{- $reg := $.root.Values.imageRegistry | default "" -}}
{{- if $reg }}{{ $reg }}/{{ end }}{{ .repository }}:{{ .tag }}
{{- end }}