# Multi-stage build: compile with Maven + JDK 21, run on a slim JRE 21.
# Used by Render (and any other Docker-based host) to build and run the backend.

FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Cache dependencies separately from source so `mvn` doesn't re-download the
# whole internet on every code change during local Docker builds.
COPY pom.xml .
RUN mvn -q -B dependency:go-offline

COPY src ./src
RUN mvn -q -B -DskipTests package

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Runs as a non-root user rather than the container default root.
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /app/target/*.jar app.jar
RUN chown app:app app.jar
USER app

# Render sets $PORT at runtime; application.properties already reads it
# (server.port=${PORT:8080}). EXPOSE is documentation only, not enforced.
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
