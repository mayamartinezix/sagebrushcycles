# Placeholder static site for Sagebrush Cycles
# (weeeeeiserbikes.staging.tripoli.systems). Stock nginx serving the
# pre-built public/ tree — no build step, just a layer copy.
FROM nginx:alpine

# Drop in the static site. nginx:alpine serves /usr/share/nginx/html on :80
# out of the box, so no custom nginx.conf is needed for a plain static site.
COPY public/ /usr/share/nginx/html/

EXPOSE 80
